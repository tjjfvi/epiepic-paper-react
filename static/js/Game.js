/* @flow */

import { observable, computed } from "./hobo";
import type { Observable, Computed } from "./hobo";
import { WS } from "./ws";

type O<T> = Observable<T>;
type C<T> = Computed<T>;

type Phase = "start" | "main" | "battle-0" | "battle-1" | "battle-2" | "battle-3" | "battle-4" | "end";
type Player = {
    n: boolean,
    user: any,
    hasTurn: C<boolean>,
    hasInitiative: C<boolean>,
    waitingOn: O<boolean>,
    attention: O<boolean>,
    gold: O<boolean>,
    health: O<number>,
};

class Game {

    static phases: Array<Phase> = ["start", "main", "battle-0", "battle-1", "battle-2", "battle-3", "battle-4", "end"];
    static phaseNames: { [Phase]: string } = {
      start: "Start Phase",
      main: "Main Phase",
      end: "End Phase",
      "battle-0": "Declare Attackers",
      "battle-1": "Attack Events",
      "battle-2": "Declare Blockers",
      "battle-3": "Block Events",
      "battle-4": "Assign Damage",
    }

    ready = observable<boolean>(false);
    turn: O<boolean>;
    initiative: O<boolean>;
    phase: O<Phase>;
    phaseName: O<string>
    p: Player;
    o: Player;
    p0: Player;
    p1: Player;

    constructor(ws: WS){
      ws.on("message", ([type, ...data]) => {
        if(type === "init") {
          let [pn, g] = data;
          this.turn = ws.observable<boolean>(g.turn, ["turn"])
          console.log(this.turn());
          this.initiative = ws.observable<boolean>(g.initiative, ["initiative"])
          this.phase = ws.observable<Phase>(g.phase, ["phase"])
          this.phaseName = computed(() => Game.phaseNames[this.phase()])
          let p = n => {
            let pn = "p" + +n;
            let p = g[pn]
            return {
              n,
              user: p.user,
              hasTurn: computed(() => this.turn() === n),
              hasInitiative: computed(() => this.initiative() === n),
              waitingOn: ws.observable<boolean>(p.waitingOn, [pn, "waitingOn"]),
              attention: ws.observable<boolean>(p.attention, [pn, "attention"]),
              gold: ws.observable<boolean>(p.gold, [pn, "gold"]),
              health: ws.observable<number>(p.health, [pn, "health"]),
            }
          };
          this.p0 = p(false);
          this.p1 = p(true);
          let [P, O] = pn ? [this.p1, this.p0] : [this.p0, this.p1];
          this.p = P;
          this.o = O;
          console.log(this.p);
          console.log("ready")
          this.ready(true);
        }
      })
    }

    cyclePhase(){
      let phase = this.phase();
      let change = {
        start: ["main", true, false, false],
        main: ["end", true, true, true],
        "battle-0": ["battle-1", true, false, false],
        "battle-1": ["battle-2", false, false, false],
        "battle-2": ["battle-3", false, false, false],
        "battle-3": ["battle-4", true, true, true],
        "battle-4": ["main", true, false, false],
        end: ["start", true, false, true],
      }[phase];
      // debugger;
      change[1] = !(+change[1] ^ +this.turn());
      if(this.turn()) {
        let x = change[2];
        change[2] = change[3]
        change[3] = x;
      }
      console.log("hi.")
      this.phase(change[0]);
      this.initiative(change[1]);
      this.p0.waitingOn(change[2]);
      this.p1.waitingOn(change[3]);
      this.p0.attention(false);
      this.p1.attention(false);
      if(phase === "end")
        this.turn.toggle();
    }

}

export default Game;
export type { Player, Phase };
