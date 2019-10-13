/* @flow */

import { observable, computed } from "./hobo";
import type { Observable, Computed } from "./hobo";

type O<T> = Observable<T>;
type C<T> = Computed<T>;

type Phase = "start" | "main" | "battle-0" | "battle-1" | "battle-2" | "battle-3" | "battle-4" | "end";
type Player = {
    n: boolean;
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

    turn = observable<boolean>(false);
    initiative = observable<boolean>(false);
    phase = observable<Phase>("start");
    phaseName = computed(() => Game.phaseNames[this.phase()])
    p: Player;
    o: Player;
    p0: Player;
    p1: Player;

    constructor(){
      let p = n => ({
        n,
        hasTurn: computed(() => this.turn() === n),
        hasInitiative: computed(() => this.initiative() === n),
        waitingOn: observable(false),
        attention: observable(false),
        gold: observable(true),
        health: observable(30),
      });
      this.p = this.p0 = p(false);
      this.o = this.p1 = p(true);
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
      change[1] = !(+change[1] ^ +this.turn());
      if(this.turn()) {
        let x = change[2];
        change[2] = change[3]
        change[3] = x;
      }
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
