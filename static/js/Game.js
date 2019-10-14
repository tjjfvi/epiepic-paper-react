/* @flow */

import { observable, computed } from "./hobo";
import type { Observable, Computed } from "./hobo";
import { WS } from "./ws";

type O<T> = Observable<T>;
type C<T> = Computed<T>;

type Phase = "start" | "main" | "battle-0" | "battle-1" | "battle-2" | "battle-3" | "battle-4" | "end";
type Zone = "hand" | "deck" | "disc" | "supp" | "play";
type Player = {
    n: boolean,
    user: any,
    hasTurn: C<boolean>,
    hasInitiative: C<boolean>,
    waitingOn: O<boolean>,
    attention: O<boolean>,
    gold: O<boolean>,
    health: O<number>,
    zones: { [Zone]: C<Array<Card>> },
};
type Card = {
  id: string,
  cardId: O<?string>,
  owner: boolean,
  zone: O<Zone>,
  player: O<boolean>,
  pos: O<number>,
}

class Game {

    static phases: Array<Phase> = ["start", "main", "battle-0", "battle-1", "battle-2", "battle-3", "battle-4", "end"];
    static zones: Array<Zone> = ["hand", "deck", "disc", "supp", "play"];
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

    ws: WS;

    ready = observable<boolean>(false);
    turn: O<boolean>;
    initiative: O<boolean>;
    phase: O<Phase>;
    phaseName: O<string>
    p: Player;
    o: Player;
    p0: Player;
    p1: Player;

    cardCount: O<number> = observable<number>(0);
    cards = new Set<Card>();
    minPos: number = 0;
    maxPos: number = 0;

    constructor(ws: WS){
      this.ws = ws;
      ws.on("message", ([type, ...data]) => {
        if(type === "init") {
          let [pn, g] = data;
          this.turn = ws.observable<boolean>(g.turn, ["turn"])
          console.log(this.turn());
          this.initiative = ws.observable<boolean>(g.initiative, ["initiative"])
          this.phase = ws.observable<Phase>(g.phase, ["phase"])
          this.phaseName = computed(() => Game.phaseNames[this.phase()])
          this.addCards(...g.cards);
          let p = (n: boolean): Player => {
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
              zones: Game.zones.map(zone => {
                let x: { [Zone]: C<Array<Card>> } = ({
                  [zone]: computed<Array<Card>>(() => {
                    this.cardCount();
                    return [...this.cards]
                      .filter((c: Card) => c.player() === n && c.zone() === zone)
                      .sort((a: Card, b: Card) => b.pos() - a.pos());
                  })
                })
                return x;
              }).reduce<{ [Zone]: C<Array<Card>> }>((b, a) => ({ ...a, ...b }), {})
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

    addCards(...cards: Array<any>){
      const { ws } = this;
      cards.map(c => {
        const { id } = c;
        let card: Card = {
          id,
          cardId: ws.observable<?string>(c.cardId, ["card", id, "cardId"]),
          owner: c.boolean,
          player: ws.observable<boolean>(c.player, ["card", id, "player"]),
          zone: ws.observable<Zone>(c.zone, ["card", id, "zone"]),
          pos: ws.observable<number>(c.pos, ["card", id, "pos"]),
        };
        this.cards.add(card);
        const updatePos = pos => {
          this.minPos = Math.min(this.minPos, pos);
          this.maxPos = Math.min(this.maxPos, pos);
        }
        updatePos(c.pos);
        card.pos.ee.on("change", updatePos);
      })
      this.cardCount(this.cardCount() + cards.length);
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
export type { Player, Phase, Card };
