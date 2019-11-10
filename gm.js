
const uuidv4 = require("uuid/v4");
const { MongoClient } = require("mongodb");

const { MDB_URL, MDB_NAME, MDB_COL } = process.env;
let db = MongoClient.connect(MDB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(client => {
  console.log("Connected to MongoDB");
  return db = client.db(MDB_NAME).collection(MDB_COL);
});

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
    if(~["gold", "goldAlignment", "health"].indexOf(prop))
      willPass(true);
    if(~["gold", "goldAlignment", "waitingOn", "attention", "health"].indexOf(prop)) {
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
    let card = {
      id: uuidv4(),
      card: cardData,
      owner,
      player,
      zone,
      pos,
      damage: 0,
      counters: 0,
      offAdjust: 0,
      defAdjust: 0,
      inBattle: false,
      status: "prepared",
      deploying: true,
      marked: false,
      public: false,
    };
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
    p.deck = [].concat(...data[0].map(({ count, card }) => [...Array(count)].map(() => ({
      id: uuidv4(),
      card: card,
      owner: !!p.n,
      player: !!p.n,
      zone: "deck",
      pos: Math.random(),
      damage: 0,
      counters: 0,
      offAdjust: 0,
      defAdjust: 0,
      inBattle: false,
      status: "prepared",
      marked: false,
      public: false,
    }))));
    if(!p.o.deck) return;
    game.cards.push(...p.deck, ...p.o.deck);
    let obj = {
      ...game,
      cards: game.cards.map(c => ({ ...c, card: null }))
    };
    p.s("init", p.n, obj);
    p.os("init", p.o.n, obj);
    p.s("oActive", p.o.active);
    p.os("oActive", p.active);
  }
  if(type === "concede") {
    game.finished = true;
    p.as("fin", !p.n)
  }
  await (await db).findOneAndUpdate({ _id: game._id }, { $set: game });
}

async function setup(ws1, ws2){
  if(Math.random() > .5)
    [ws1, ws2] = [ws2, ws1];
  let f = ws => ({
    user: ws.user,
    health: 30,
    gold: true,
    waitingOn: true,
    attention: false,
  });
  let game = ({
    _id: uuidv4(),
    p0: f(ws1),
    p1: f(ws2),
    turn: false,
    phase: "start",
    initiative: false,
    willPass: true,
    log: [],
    cards: [],
  });
  let p0 = genP(ws1, game, false);
  let p1 = genP(ws2, game, true);
  p0.o = p1;
  p1.o = p0;
  p0.p0 = p0;
  p0.p1 = p1;
  p1.p0 = p0;
  p1.p1 = p1;
  p0s[game._id] = p0;
  await (await db).insertOne(game);
}

function genP(ws, game, n){
  let p = {};
  if(ws) ws.p = p;
  p.active = +!!ws;
  p.n = n;
  p.game = game;
  p.wss = [ws];
  p.s = (...a) => p.wss.map(ws => ws && ws.s(...a));
  p.os = (...a) => p.o.s(...a);
  p.as = (...a) => (p.s(...a), p.os(...a));
  return p;
}

async function getReconnectGames(ws){
  let id = ws.user._id;
  return (await db.find({
    $or: [{ "p0.user._id": id }, { "p1.user._id": id }],
    finished: { $ne: true },
  }).toArray()).map(game => {
    let oUser = game.p0.user._id === id ? game.p1.user : game.p0.user;
    return { oUser, id: game._id, game };
  });
}

async function reconnect(ws, { game }){
  let p0 = p0s[game._id];
  let p;
  if(!p0) {
    let pn = game.p0.user._id !== ws.user._id;
    p0 = genP(null, game, false);
    let p1 = genP(null, game, true);
    p0.p0 = p0;
    p0.p1 = p1;
    p1.p0 = p0;
    p1.p1 = p1;
    p0.o = p1;
    p1.o = p0;
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
  p.os("oActive", p.active);
  p.wss.push(ws);
  ws.p = p;
  ws.s("init", p.n, {
    ...game,
    cards: game.cards.map(c =>
      (!c.public && (c.zone === "deck" || (c.player !== p.n && c.zone === "hand"))) ?
        { ...c, card: null } :
        c
    )
  });
  ws.s("oActive", p.o.active);
  return;
}

function disconnect(ws){
  ws.p.active--;
  ws.p.os("oActive", ws.p.active);
}

async function log(p, ...log){
  log.map(l => l.p = !!p.n);
  p.as("log", ...log);
  p.game.log.push(...log);
}

module.exports = { handle, setup, getReconnectGames, reconnect, disconnect };
