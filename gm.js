
const uuidv4 = require("uuid/v4");
// const games = {};

async function handle(ws, type, ...data){
  let { game } = ws;
  if(~["turn", "phase", "initiative"].indexOf(type)) {
    game[type] = data[0];
    ws.o.s(type, data[0]);
  }
  if(type === "p0" || type === "p1") {
    let [prop, val] = data;
    if(~["gold", "waitingOn", "attention", "health"].indexOf(prop)) {
      game[type][prop] = val;
      ws.o.s(type, prop, val);
    }
  }
  if(type === "card" && ~["zone", "player", "pos"].indexOf(data[1])) {
    let [id, prop, val] = data;
    let card = game.cards.find(c => c.id === id);
    if(!card) return;
    card[prop] = val;
    ws.o.s(type, id, prop, val);
    if(prop === "zone" || prop === "player") {
      let p = ws["p" + +card.player];
      let o = p.o;
      if(card.zone !== "deck") {
        p.s(type, id, "card", card.card);
        if(card.zone !== "hand")
          o.s(type, id, "card", card.card);
      }
    }
  }
  if(type === "deck") {
    if(ws.deck) return;
    ws.deck = [].concat(...data[0].map(({ count, card }) => [...Array(count)].map(() => ({
      id: uuidv4(),
      card: card,
      owner: !!ws.n,
      player: !!ws.n,
      zone: "deck",
      pos: Math.random(),
    }))));
    if(!ws.o.deck) return;
    game.cards.push(...ws.deck, ...ws.o.deck);
    let obj = {
      ...game,
      p0: { ...game.p0, ws: null },
      p1: { ...game.p1, ws: null },
      cards: game.cards.map(c => ({ ...c, cardId: null }))
    };
    [ws, ws.o].map(ws => ws.s("init", ws.n, obj));
  }
}

async function setup(ws1, ws2){
  if(Math.random() > .5)
    [ws1, ws2] = [ws2, ws1];
  let genP = ws => ({
    user: ws.user,
    health: 30,
    gold: 1,
    waitingOn: true,
    attention: false,
  });
  let game = ({
    p0: genP(ws1),
    p1: genP(ws2),
    turn: false,
    phase: "start",
    initiative: false,
    cards: [],
  });
  // games[game._id.toString()] = game;
  game.p0.ws = ws1;
  game.p1.ws = ws2;
  ws1.game = game;
  ws2.game = game;
  ws1.o = ws2;
  ws2.o = ws1;
  ws1.p0 = ws2.p0 = ws1;
  ws1.p1 = ws2.p1 = ws2;
  ws1.n = 0;
  ws2.n = 1;
    // ---
}

module.exports = { handle, setup };