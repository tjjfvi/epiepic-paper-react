/* eslint-disable no-console */
require("dotenv").config();

const express = require("express");
const browserify = require("browserify");
const babelify = require("babelify");
const watchify = require("watchify");
const fs = require("fs-extra");
const stylus = require("stylus");
const watch = require("node-watch");
const { promisify } = require("util");
const fetch = require("node-fetch");
const uuidv4 = require("uuid/v4");

const generateCard = require("./generateCard");
const gm = require("./gm");

const { BASE_URL, API_BASE_URL, DEBUG } = process.env;

const cardDataPromise = fetch(API_BASE_URL + "api/card/.json")
  .then(r => r.text())
  .then(cardData => fs.writeFile(__dirname + "/static/cardData.js",
    "export default JSON.parse(" + JSON.stringify(cardData) + ");"
  ));

let wss;

const b = browserify(__dirname + "/static/js/index.js", {
  entries: [
    "node_modules/babel-polyfill",
    __dirname + "/static/js/index.js",
  ],
  cache: {},
  packageCache: {},
  debug: !!DEBUG,
  plugin: [ watchify ],
}).transform(babelify, {
  presets: [
    "@babel/preset-env",
    "@babel/preset-react",
    "@babel/preset-flow",
  ],
  plugins: [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    "@babel/plugin-proposal-optional-chaining",
  ],
  global: true,
  ignore: [/\/node_modules\/(?!rhobo\/)/],
});

b.on("update", bundle);
bundle();

async function bundle(){
  await cardDataPromise;
  console.log("Bundling client JS...");
  b.bundle()
    .on("end", () => console.log("Bundled client JS"))
    .on("error", e => console.error(e))
    .pipe(fs.createWriteStream(__dirname + "/static/bundle.js"));
}

async function bundleStylus(){
  console.log("Bundling stylus...");
  let css = await promisify(stylus.render)(
    `@import '${__dirname + "/static/stylus/"}*'`,
    {
      filename: "_.styl",
      sourcemap: {
        comment: false,
        inline: true,
        basePath: __dirname + "/static/",
      },
    }
  );
  if(wss)
    wss.all.map(ws => ws.s("style", css));
  await fs.writeFile(__dirname + "/static/bundle.css", css);
  console.log("Bundled stylus");
}

bundleStylus();
if(DEBUG) watch(__dirname + "/static/stylus/", {
  persistent: false,
  recursive: true,
}, bundleStylus);

const app = express();
require("express-ws")(app);
app.use(express.static(__dirname + "/static/"));
wss = {
  waiting: [],
  hosting: [],
  byId:    [],
  all:     [],
};
app.use(require("cookie-parser")());
app.ws("/ws", async (ws, req) => {
  ws.s = function(...data){
    if(this.readyState !== 1)
      return data;
    this.send(JSON.stringify(data));
  }

  let token = req.cookies.token;
  let user = await fetch(`${API_BASE_URL}api/user/current`, {
    headers: { Cookie: `token=${token}` },
  }).then(r => r.json()).catch(() => null);
  if(!user)
    return ws.s("login");

  wss.all.push(ws);
  ws.user = user;

  ws.reconnectGames = gm.getReconnectGames(ws).then(games => (ws.s("reconnectGames", games), games));
  updateSpectate([ws]);

  ws.status = "waiting";
  wss.waiting.push(ws);
  sendGames([ws]);
  setInterval(() => ws.s("ping"), 500);

  ws.on("message", async message => {
    let type, data;
    try {
      [type, ...data] = JSON.parse(message);
    } catch (e) {
      return;
    }

    if(type === "join") {
      if(ws.status !== "waiting")
        return;

      let [id, pswd] = data;
      let ws2 = wss.byId[id];

      if(!ws2 || !~wss.hosting.indexOf(ws2) || pswd !== ws2.pswd)
        return ws.s("joinFailed");

      wss.hosting.splice(wss.hosting.indexOf(ws2), 1);
      wss.waiting.splice(wss.waiting.indexOf(ws), 1);
      sendGames();

      ws.o = ws2;
      ws2.o = ws;

      if(ws2.mode === "constructed" || ws2.mode === "rmr30") {
        ws.status = ws2.status = "playing";
        sendStatus(ws, ws2);

        gm[ws2.mode === "rmr30" ? "setupRMR30" : "setup"](ws2, ws, pswd).catch(gmError(ws));
        updateSpectate();
      } else if(ws2.mode === "draft") {
        ws.status = ws2.status = "drafting";
        sendStatus(ws, ws2);

        gm.setupDraft(ws2, ws, pswd).catch(gmError(ws));
      }
      return;
    }
    if(type === "host") {
      if(ws.status !== "waiting")
        return;

      let [pswd, mode] = data;

      if(!~["constructed", "draft", "rmr30"].indexOf(mode))
        mode = "constructed";

      let name = `@${ws.user.username}#${ws.user.discriminator}`;

      ws.id = uuidv4();
      wss.byId[ws.id] = ws;
      ws.name = name;
      ws.pswd = pswd;
      ws.mode = mode;

      wss.waiting.splice(wss.waiting.indexOf(ws), 1);
      wss.hosting.push(ws);
      sendGames();

      ws.status = "hosting";

      sendStatus(ws);

      return;
    }
    if(type === "reconnect") {
      if(ws.status !== "waiting")
        return;

      ws.status = "reconnecting";
      sendStatus(ws);

      let [id] = data

      let games = await ws.reconnectGames;
      let game = games.find(g => g.id.toString() === id);

      if(!game) return;
      // eslint-disable-next-line require-atomic-updates
      ws.status = game.mode === "draft" ? "drafting" : "playing";
      sendStatus(ws);

      if(game.mode === "draft")
        gm.reconnectDraft(ws, game).catch(gmError(ws));
      else
        gm.reconnect(ws, game).catch(gmError(ws));
    }
    if(type === "spectate") {
      if(ws.status !== "waiting")
        return;

      let [id, pswd] = data;
      let g = ws.spectateGames.find(g => g.id.toString() === id);

      if(!g || (g.v.pswd && pswd !== g.game.pswd)) return ws.s("joinFailed");

      // eslint-disable-next-line require-atomic-updates
      ws.status = "spectating";
      sendStatus(ws);

      gm.spectate(ws, g.game).catch(gmError(ws));
    }
    if(ws.status === "playing")
      gm.handle(ws, type, ...data).catch(gmError(ws));
    if(ws.status === "drafting")
      gm.handleDraft(ws, type, ...data).catch(gmError(ws));
  })

  ws.on("close", () => {
    if(ws.status === "drafting")
      return gm.disconnectDraft(ws);
    if(ws.status === "playing")
      return gm.disconnect(ws);
    wss[ws.status] && wss[ws.status].splice(wss[ws.status].indexOf(ws), 1);
    if(ws.status === "hosting")
      sendGames();
  })

})

app.get("/login", (req, res) =>
  res.redirect(API_BASE_URL + "api/discord/login?redirect=" + encodeURIComponent(BASE_URL))
);
app.use("/api", (req, res) =>
  req.pipe(require("request")(API_BASE_URL + "api" + req.url, { headers: req.headers }).on("response", r => {
    res.set(r.headers)
  })).pipe(res)
);
app.get("/images/:id.svg", (req, res) =>
  fetch(API_BASE_URL + `api/card:${req.params.id}/`)
    .then(r => r.json())
    .then(c => res.set("Content-Type", "image/svg+xml").send(generateCard(c)))
);
app.get("/images/:id", (req, res) => res.redirect(302, BASE_URL + req.path.slice(1) + ".svg"));

const port = process.env.PORT || 22563;

app.listen(port, () => console.log(`Listening on http://localhost:${port}/`))

function sendGames(ws_ = wss.waiting){
  ws_.map(ws => ws.s("games", wss.hosting.map(({ id, name, mode, pswd }) => ({
    id,
    name,
    mode,
    pswd: !!pswd,
  }))));
}

function sendStatus(...wss){
  wss.map(ws => ws.s("status", ws.status));
}

function gmError(ws){
  return e => {
    ws.status = (ws.o || {}).status = "error";
    sendStatus(ws, ws.o || { s: () => {} });
    console.error((ws.game || {})._id, e);
  }
}

function updateSpectate(ws_ = wss.waiting){
  ws_.map(ws => ws.s("spectateGames", (ws.spectateGames = gm.getSpectateGames(ws)).map(g => g.v)));
}
