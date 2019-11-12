/* eslint-disable require-atomic-updates */

const { API_BASE_URL } = process.env;
const fetch = require("node-fetch");

module.exports = (db, { setupFromDraft }) => {
  const uuidv4 = require("uuid/v4");
  const cardData = fetch(API_BASE_URL + "api/card/.json").then(r => r.json());

  async function handleDraft(ws, type, ...data){
    let { game, n } = ws;
    if(type === "select") {
      if(!game["hand" + n].length)
        return;
      let [selection] = data;
      game["deck" + n].push(...selection);
      let rest = game["hand" + n].filter(c => !selection.find(C => c._id === C._id));
      game["hand" + n] = [];
      if(game.phase % 1)
        game["dead" + n].push(...rest);
      else
        game["next" + +!n] = rest;
      next(game, ws.p0, ws.p1);
    }
  }

  function next(game, ws1, ws2){
    if(game.hand0.length || game.hand1.length)
      return;
    game.phase++;
    if(game.phase >= 20)
      return setupFromDraft(game, ws1, ws2, game.pswd);
    if(game.phase % 2) {
      game.hand0 = game.next0;
      game.hand1 = game.next1;
      game.next0 = [];
      game.next1 = [];
    } else {
      game.hand0 = draw(game, 5);
      game.hand1 = draw(game, 5);
    }
    ws1.s("hand", game.hand0);
    ws2.s("hand", game.hand1);
    ws1.s("phase", game.phase);
    ws2.s("phase", game.phase);
  }

  function draw(game, n){
    return [...Array(n)].map(() => game.pool.splice(Math.floor(Math.random() * game.pool.length), 1)[0]);
  }

  async function setupDraft(ws1, ws2, pswd){
    if(Math.random() > .5)
      [ws1, ws2] = [ws2, ws1];
    let game = {
      _id: uuidv4(),
      pool: [...(await cardData)],
      dead0: [],
      dead1: [],
      deck0: [],
      deck1: [],
      next0: [],
      next1: [],
      hand0: [],
      hand1: [],
      phase: -1,
      drafting: true,
      pswd,
    };
    ws1.n = 0;
    ws1.o = ws2;
    ws2.n = 1;
    ws2.o = ws1;
    ws1.game = ws2.game = game;
    ws1.p0 = ws2.p0 = ws1;
    ws1.p1 = ws2.p1 = ws2;
    next(game, ws1, ws2);
    await (await db).insertOne(game);
  }

  return { setupDraft, handleDraft };
}
