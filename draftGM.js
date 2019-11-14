/* eslint-disable require-atomic-updates */

const { API_BASE_URL } = process.env;
const fetch = require("node-fetch");

module.exports = (db, { setupFromDraft }) => {
  const uuidv4 = require("uuid/v4");
  const cardData = fetch(API_BASE_URL + "api/card/.json").then(r => r.json());

  const p0s = {};

  async function handleDraft(ws, type, ...data){
    let { p } = ws;
    let { game, n } = p;
    if(type === "select") {
      if(!game["hand" + n].length)
        return;
      let [selection] = data;
      game["deck" + n].push(...selection);
      let rest = game["hand" + n].filter(c => !selection.find(C => c._id === C._id));
      game["hand" + n] = [];
      if(game.phase % 2)
        game["burnt" + n].push(...rest);
      else
        game["passed" + n].push(...(game["next" + +!n] = rest));
      next(game, p.p0, p.p1);
    }
    await (await db).findOneAndUpdate({ _id: game._id }, { $set: game });
  }

  function next(game, p0, p1){
    if(game.hand0.length || game.hand1.length)
      return;
    game.phase++;
    if(game.phase >= 20)
      return setupFromDraft(game, p0, p1, game.pswd);
    if(game.phase % 2) {
      game.hand0 = game.next0;
      game.hand1 = game.next1;
      game.next0 = [];
      game.next1 = [];
    } else {
      game.hand0 = draw(game, 5);
      game.hand1 = draw(game, 5);
    }
    p0.s("hand", game.hand0);
    p1.s("hand", game.hand1);
    p0.s("phase", game.phase);
    p1.s("phase", game.phase);
  }

  function draw(game, n){
    return [...Array(n)].map(() => game.pool.splice(Math.floor(Math.random() * game.pool.length), 1)[0]);
  }

  async function setupDraft(ws1, ws2, pswd){
    if(Math.random() > .5)
      [ws1, ws2] = [ws2, ws1];
    let game = {
      _id: uuidv4(),
      pool: [...(await cardData)].filter(c => c.packCode !== "tokens"),
      user0: ws1.user,
      passed0: [],
      burnt0: [],
      deck0: [],
      next0: [],
      hand0: [],
      user1: ws2.user,
      passed1: [],
      burnt1: [],
      deck1: [],
      next1: [],
      hand1: [],
      phase: -1,
      drafting: true,
      pswd,
    };
    let p0 = genP(ws1, game, 0);
    let p1 = genP(ws2, game, 1);
    p0.o = p1;
    p1.o = p0;
    p0.p0 = p1.p0 = p0;
    p0.p1 = p1.p1 = p1;
    next(game, ws1, ws2);
    await (await db).insertOne(game);
  }

  async function reconnectDraft(ws, { game }){
    let p0 = p0s[game._id];
    let p;
    if(!p0) {
      let pn = game.user0._id !== ws.user._id;
      p0 = genP(null, game, 0);
      let p1 = genP(null, game, 1);
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
      p = game.user0._id !== ws.user._id ?
        p0.o :
        game.user1._id !== ws.user._id ?
          p0 :
          p0.active ?
            p0.o :
            p0;
    }
    p.active++;
    p.wss.push(ws);
    ws.p = p;
    ws.s("phase", p.game.phase);
    ws.s("hand", p.game["hand" + p.n]);
    ws.s("deck", p.game["deck" + p.n]);
    ws.s("burnt", p.game["burnt" + p.n]);
    ws.s("passed", p.game["passed" + p.n]);
    if(game.phase >= 20)
      return setupFromDraft(game, p0, p0.o, game.pswd);
  }

  function genP(ws, game, n){
    let p = {};
    if(ws)
      ws.p = p;
    p.game = game;
    p.n = n;
    p.wss = [ws];
    p.active = +!!ws;
    p.p = p;
    p.s = (...a) => p.wss.map(ws => ws && ws.s(...a));
    return p;
  }

  function disconnectDraft(ws){
    ws.p.active--;
  }

  function genDraftUrl(game, n){
    let deck = game["deck" + n];
    let passed = game["passed" + n];
    let burnt = game["burnt" + n];
    return "https://draftviewer.epiepic.com/?draft=" + [...Array(game.phase)].map((_, i) => {
      if(i % 2 === 0)
        return [deck[i / 2 * 3], ...passed.slice(i / 2 * 4).slice(0, 4)];
      return [...deck.slice(i / 2 + .5).slice(0, 2), ...burnt.slice(i - 1).slice(0, 2)];
    }).map(cs => cs.map(c => c._id).join("+")).join("/")
  }

  return { setupDraft, handleDraft, reconnectDraft, disconnectDraft, genDraftUrl };

}
