/* eslint-disable require-atomic-updates */

const uuidv4 = require("uuid/v4");
const { MongoClient } = require("mongodb");

const { MDB_URL, MDB_NAME, MDB_COL } = process.env;
let db = MongoClient.connect(MDB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(client => {
  console.log("Connected to MongoDB");
  return db = client.db(MDB_NAME).collection(MDB_COL);
});

const draftGM = require("./draftGM")(db, { setupFromDraft });

const p0s = {};

async function handle(ws, type, ...data){
  let { p } = ws;
  let { game } = p;
  let willPass = v => {
    game.willPass = v;
    p.as("willPass", v);
  };
  if(~["turn", "phase", "initiative"].indexOf(type)) {
    willPass(type !== "initiative");
    let old = game[type];
    game[type] = data[0];
    p.as(type, data[0]);
    log(p, {
      type: "set",
      path: [type],
      val: data[0],
      old,
    });
  }
  if(type === "p0" || type === "p1") {
    let [prop, val] = data;
    if(~["gold", "health"].indexOf(prop))
      willPass(true);
    if(~["gold", "waitingOn", "attention", "health"].indexOf(prop)) {
      let old = game[type][prop];
      game[type][prop] = val;
      p.as(type, prop, val);
      log(p, {
        type: "set",
        path: [type, prop],
        val,
        old,
      });
    }
  }
  if(type === "card" && ~[
    "zone",
    "player",
    "pos",
    "damage",
    "counters",
    "offAdjust",
    "defAdjust",
    "status",
    "deploying",
    "inBattle",
    "marked",
    "public",
  ].indexOf(data[1])) {
    willPass(true);
    let [id, prop, val] = data;
    let _val = val;
    if(prop === "zone" && val === "banish")
      val = "deck";
    let card = game.cards.find(c => c.id === id);
    if(!card) return;
    let old = card[prop];
    card[prop] = val;
    p.as(type, id, prop, val);
    log(p, {
      type: "set",
      path: [type, id, prop],
      val: _val,
      old,
    });
    if(prop === "public" && !val)
      p.os(type, id, "card", null);
    if(prop === "zone" || prop === "player" || (prop === "public" && !val)) {
      let P = p["p" + +card.player];
      let O = P.o;
      if(card.zone !== "deck") {
        P.s(type, id, "card", card.card);
        if(card.zone !== "hand") {
          O.s(type, id, "card", card.card);
          if(!card.public)
            p.as(type, id, "public", card.public = true);
        }
      }
    }
    if(prop === "public" && val)
      p.as(type, id, "card", card.card);
  }
  if(type === "newCard") {
    let [cardData, owner, player, zone, pos] = data;
    let card = newCard({
      card: cardData,
      owner,
      player,
      zone,
      pos,
      deploying: true,
    });
    game.cards.push(card);
    p.as("newCard", card);
    log(p, {
      type: "newCard",
      id: card.id,
      owner,
      player,
      zone,
      pos,
    })
  }
  if(type === "deck") {
    if(p.deck) return;
    p.deck = [].concat(...data[0].map(({ count, card }) => [...Array(count)].map(() => newCard({ card }, !!p.n))))
    if(!p.o.deck) return;
    setupCont(p);
  }
  if(type === "concede") {
    game.finished = true;
    p.as("fin", !p.n, game.finData);
  }
  await (await db).findOneAndUpdate({ _id: game._id }, { $set: game });
}

function newCard(props, owner){
  return {
    id: uuidv4(),
    zone: "deck",
    pos: Math.random(),
    damage: 0,
    counters: 0,
    offAdjust: 0,
    defAdjust: 0,
    inBattle: false,
    status: "prepared",
    deploying: false,
    marked: false,
    public: false,
    owner,
    player: owner,
    ...props,
  }
}

async function setupFromDraft(dg, dp0, dp1, pswd){
  [dp0, dp1].map(p => p.wss.map(ws => ws && ws.s("status", ws.status = "playing")));
  let p0 = await setup(null, null, pswd, dg.user0, dg.user1, dp0.wss, dp1.wss);
  let game = p0.game;
  game.finData = {
    p0Draft: draftGM.genDraftUrl(dg, 0),
    p1Draft: draftGM.genDraftUrl(dg, 1),
  };
  [p0, p0.o].map((p, i) => p.deck = dg["deck" + i].map(c => newCard({ card: c }, p.n)));
  await setupCont(p0);
  dg.finished = true;
  await (await db).findOneAndUpdate({ _id: dg._id }, { $set: { finished: true } });
  await (await db).findOneAndUpdate({ _id: game._id }, { $set: game });
}

async function setupCont(p){
  let { game } = p;
  game.cards.push(...p.deck, ...p.o.deck);
  let obj = {
    ...game,
    cards: game.cards.map(c => ({ ...c, card: null })),
    finData: null,
  };
  p.s("init", p.n, obj);
  p.os("init", p.o.n, obj);
  p.as("p0", "active", p.p0.active);
  p.as("p1", "active", p.p1.active);
}

async function setup(ws1, ws2, pswd, user1 = ws1.user, user2 = ws2.user, wss1 = [ws1], wss2 = [ws2], shuffle = true){
  if(shuffle && Math.random() > .5)
    [ws1, ws2, user1, user2, wss1, wss2] = [ws2, ws1, user2, user1, wss2, wss1];
  let f = user => ({
    user,
    health: 30,
    gold: true,
    waitingOn: true,
    attention: false,
  });
  let game = ({
    _id: uuidv4(),
    p0: f(user1),
    p1: f(user2),
    turn: false,
    phase: "start",
    initiative: false,
    willPass: true,
    log: [],
    cards: [],
    pswd,
  });
  let p0 = genP(wss1, game, false);
  let p1 = genP(wss2, game, true);
  p0.o = p1;
  p1.o = p0;
  p0.p0 = p0;
  p0.p1 = p1;
  p1.p0 = p0;
  p1.p1 = p1;
  p0.specs = p1.specs = [];
  p0s[game._id] = p0;
  await (await db).insertOne(game);
  return p0;
}

function genP(wss, game, n){
  let p = {};
  wss.map(ws => ws && (ws.p = p));
  p.active = wss.filter(ws => ws && ws.readyState === 1).length;
  p.n = n;
  p.game = game;
  p.wss = wss;
  p.p = p;
  p.s = (...a) => p.wss.map(ws => ws && ws.s(...a));
  p.os = (...a) => p.o.s(...a);
  p.ss = (...a) => p.specs.map(ws => ws && ws.s(...a));
  p.as = (...a) => (p.s(...a), p.os(...a), p.ss(...a));
  return p;
}

async function getReconnectGames(ws){
  let id = ws.user._id;
  return (await db.find({
    $or: [{ "p0.user._id": id }, { "p1.user._id": id }, { "user0._id": id }, { "user1._id": id }],
    finished: { $ne: true },
  }).toArray()).map(game => {
    let oUser = game.drafting ?
      game.user0._id === id ? game.user1 : game.user0 :
      game.p0.user._id === id ? game.p1.user : game.p0.user
    return { oUser, id: game._id, mode: game.drafting ? "draft" : "constructed", game };
  });
}

async function reconnect(ws, { game }){
  let p0 = p0s[game._id];
  let p;
  if(!p0) {
    let pn = game.p0.user._id !== ws.user._id;
    p0 = genP([], game, false);
    let p1 = genP([], game, true);
    p0.p0 = p0;
    p0.p1 = p1;
    p1.p0 = p0;
    p1.p1 = p1;
    p0.o = p1;
    p1.o = p0;
    p0.specs = p1.specs = [];
    p = pn ? p1 : p0;
    p0s[game._id] = p0;
  } else {
    game = p0.game;
    p = game.p0.user._id !== ws.user._id ?
      p0.o :
      game.p1.user._id !== ws.user._id ?
        p0 :
        p0.active ?
          p0.o :
          p0;
  }
  p.active++;
  p.wss.push(ws);
  ws.p = p;
  ws.s("init", p.n, {
    ...game,
    cards: game.cards.map(c =>
      (!c.public && (c.zone === "deck" || (c.player !== p.n && c.zone === "hand"))) ?
        { ...c, card: null } :
        c
    ),
    finData: null,
  });
  p.as("p0", "active", p0.active);
  p.as("p1", "active", p0.o.active);
  return;
}

async function spectate(ws, game){
  let p0 = p0s[game._id];
  if(!p0)
    throw new Error("!!!");
  p0.specs.push(ws);
  ws.s("init", Math.random() > .5, {
    ...game,
    cards: game.cards.map(c =>
      (!c.public && (c.zone === "deck" || c.zone === "hand")) ?
        { ...c, card: null } :
        c
    ),
    finData: null,
  }, true);
  ws.s("p0", "active", p0.active);
  ws.s("p1", "active", p0.o.active);
}

function disconnect(ws){
  ws.p.active--;
  ws.p.as("p" + +ws.p.n, "active", ws.p.active);
}

async function log(p, ...log){
  log.map(l => l.p = !!p.n);
  p.as("log", ...log);
  p.game.log.push(...log);
}

function getSpectateGames(ws){
  return Object.values(p0s)
    .filter(p0 => p0.active || p0.o.active)
    .filter(p0 => p0.game.p0.user._id !== ws.user._id && p0.game.p1.user._id !== ws.user._id)
    .map(p0 => ({
      id: p0.game._id,
      v: {
        id: p0.game._id,
        p0: p0.game.p0.user,
        p1: p0.game.p1.user,
        pswd: !!p0.game.pswd,
      },
      game: p0.game,
    }));
}

module.exports = {
  handle,
  setup,
  getReconnectGames,
  reconnect,
  disconnect,
  getSpectateGames,
  spectate,
  ...draftGM,
};
