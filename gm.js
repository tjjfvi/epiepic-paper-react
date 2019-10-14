
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
    log: [],
    cards: [{
      id: "test",
      cardId: "set1-muse",
      owner: false,
      player: false,
      zone: "hand",
      pos: 1,
    }],
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
  let obj = { ...game, p0: { ...game.p0, ws: null }, p1: { ...game.p1, ws: null } };
  [ws1, ws2].map(ws => ws.s("init", ws.n, obj));
}

module.exports = { handle, setup };
