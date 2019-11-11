/* @flow */

import React from "react";
import { observable, computed } from "rhobo";
import type { Observable, Computed } from "rhobo";
import { WS } from "./ws";
import cardData from "./cardData";
import { go } from "./App";

type O<T> = Observable<T>;
type C<T> = Computed<T>;

type Alignment = "good" | "sage" | "evil" | "wild";
type Gold = false | true | Alignment;
type Phase = "start" | "main" | "battle-0" | "battle-1" | "battle-2" | "battle-3" | "battle-4" | "end";
type Zone = "hand" | "deck" | "disc" | "supp" | "play" | "none" | "banish";
type CardStatus = "prepared" | "expended" | "flipped";
type Player = {
    n: boolean,
    user: any,
    hasTurn: C<boolean>,
    hasInitiative: C<boolean>,
    waitingOn: O<boolean>,
    attention: O<boolean>,
    gold: O<Gold>,
    health: O<number>,
    zones: { [Zone]: C<Array<Card>> },
    game: Game,
};
type Card = {
  id: string,
  card: O<any>,
  owner: boolean,
  zone: O<Zone>,
  player: O<boolean>,
  pos: O<number>,
  damage: O<number>,
  counters: O<number>,
  offAdjust: O<number>,
  defAdjust: O<number>,
  inBattle: O<boolean>,
  deploying: O<boolean>,
  status: O<CardStatus>,
  off: C<number>,
  def: C<number>,
  marked: O<boolean>,
  public: O<boolean>,
};
type LogEntry =
  | {
    type: "set",
    path: Array<string>,
    val: any,
    old: any,
    p: boolean,
  }
  | {
    type: "newCard",
    id: string,
    player: boolean,
    owner: boolean,
    zone: Zone,
    pos: number,
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

    static zones: Array<Zone> = ["hand", "deck", "disc", "supp", "play"];
    static zoneNames: {[Zone]: string } = {
      hand: "Hand",
      deck: "Deck",
      disc: "Discard",
      supp: "Supplemental",
      play: "Play",
      banish: "Banished",
    }

    static cardStatuses: Array<CardStatus> = ["prepared", "expended", "flipped"];

    static alignments: Array<Alignment> = ["good", "sage", "evil", "wild"];
    static alignmentNames: {[Alignment]: string} = {
      good: "Good",
      sage: "Sage",
      evil: "Evil",
      wild: "Wild",
    };

    ws: WS;

    ready = observable<boolean>(false);
    turn: O<boolean>;
    initiative: O<boolean>;
    phase: O<Phase>;
    willPass: O<boolean>;
    oActive: O<number>;
    p: Player;
    o: Player;
    p0: Player;
    p1: Player;

    cardCount: O<number> = observable<number>(0);
    cards = new Set<Card>();
    minPos: number = 0;
    maxPos: number = 0;

    phaseName: C<string>;
    hideInitiative: C<boolean>;
    canProceed: C<boolean>;
    shouldProceed: C<boolean>;
    canPass: C<boolean>;
    willProceed: C<boolean>;

    log = observable<Array<LogEntry>>([]);

    constructor(ws: WS){
      this.ws = ws;
      ws.on("message", ([type, ...data]) => {
        if(type === "init") {
          let [pn, g] = data;
          this.turn = ws.observable<boolean>(g.turn, ["turn"])
          this.initiative = ws.observable<boolean>(g.initiative, ["initiative"])
          this.phase = ws.observable<Phase>(g.phase, ["phase"])
          this.willPass = ws.observable<boolean>(g.willPass, ["willPass"]);
          this.oActive = ws.observable<number>(0, ["oActive"]);
          this.log(g.log);
          this.addCards(...g.cards);
          let p = (n: boolean): Player => {
            let pn = "p" + +n;
            let p = g[pn]
            let player = {
              n,
              user: p.user,
              hasTurn: computed(() => this.turn() === n),
              hasInitiative: computed(() => this.initiative() === n),
              waitingOn: ws.observable<boolean>(p.waitingOn, [pn, "waitingOn"]),
              attention: ws.observable<boolean>(p.attention, [pn, "attention"]),
              gold: ws.observable<Gold>(p.gold, [pn, "gold"]),
              health: ws.observable<number>(p.health, [pn, "health"]),
              zones: Game.zones.map(zone => {
                let x: { [Zone]: C<Array<Card>> } = ({
                  [zone]: computed<Array<Card>>(() => {
                    this.cardCount();
                    return [...this.cards]
                      .filter((c: Card) => c.player() === n && c.zone() === zone)
                      .sort((a: Card, b: Card) => a.pos() - b.pos());
                  })
                })
                return x;
              }).reduce<{ [Zone]: C<Array<Card>> }>((b, a) => ({ ...a, ...b }), {}),
              game: this
            };
            return player;
          };
          this.p0 = p(false);
          this.p1 = p(true);
          let [P, O] = pn ? [this.p1, this.p0] : [this.p0, this.p1];
          this.p = P;
          this.o = O;

          this.phaseName = computed(() => Game.phaseNames[this.phase()]);
          this.hideInitiative = computed(() => ~[
            "start",
            "battle-0",
            "battle-2",
            "battle-4",
            "end"
          ].indexOf(this.phase()));
          this.canProceed = computed(() =>
            (this.p.hasInitiative() || this.hideInitiative()) &&
            !this.o.waitingOn() &&
            !this.p.attention() &&
            !this.o.attention() &&
          true);
          this.shouldProceed = computed(() =>
            this.canProceed() &&
            this.hideInitiative() &&
            !this.p.waitingOn() &&
          true);
          this.canPass = computed(() =>
            this.p.hasInitiative() && !this.hideInitiative()
          );
          this.willProceed = computed(() =>
            this.canPass() && !this.willPass()
          );

          this.ready(true);
        }
        if(type === "newCard")
          this.addCards(data[0]);
        if(type === "log")
          this.log([...this.log(), ...data]);
        if(type === "fin")
          go(() => <div className="fin">{data[0] === this.p.n ? "You won!" : "You lost."}</div>);
      })
    }

    addCards(...cards: Array<any>){
      const { ws } = this;
      cards.map(c => {
        const { id } = c;
        let _card: $Diff<Card, {off: any, def: any}> = {
          id,
          card: ws.observable<any>(c.card, ["card", id, "card"]),
          owner: c.owner,
          player: ws.observable<boolean>(c.player, ["card", id, "player"], 10),
          zone: ws.observable<Zone>(c.zone, ["card", id, "zone"], 10),
          pos: ws.observable<number>(c.pos, ["card", id, "pos"], 10),
          damage: ws.observable<number>(c.damage, ["card", id, "damage"]),
          counters: ws.observable<number>(c.counters, ["card", id, "counters"]),
          offAdjust: ws.observable<number>(c.offAdjust, ["card", id, "offAdjust"]),
          defAdjust: ws.observable<number>(c.defAdjust, ["card", id, "defAdjust"]),
          inBattle: ws.observable<boolean>(c.inBattle, ["card", id, "inBattle"]),
          deploying: ws.observable<boolean>(c.deploying, ["card", id, "deploying"]),
          status: ws.observable<CardStatus>(c.status, ["card", id, "status"]),
          marked: ws.observable<boolean>(c.marked, ["card", id, "marked"]),
          public: ws.observable<boolean>(c.public, ["card", id, "public"]),
        };
        let card: Card = Object.assign({}, _card, {
          off: computed<number>(
            () => _card.card() ? _card.card().offense + _card.offAdjust() + _card.counters() : 0,
            v => _card.card() && _card.offAdjust(v - _card.card().offense - _card.counters()),
          ),
          def: computed<number>(
            () => _card.card() ? _card.card().defense + _card.defAdjust() + _card.counters() : 0,
            v => _card.card() && _card.defAdjust(v - _card.card().defense - _card.counters()),
          ),
        });
        card.zone.ee.on("change", v => {
          if(card.card() && card.card().packCode === "tokens" && v !== "none")
            card.zone("none");
          if(card.zone() === "play")
            card.deploying(true);
        })
        this.cards.add(card);
        const updatePos = pos => {
          this.minPos = Math.min(this.minPos, pos);
          this.maxPos = Math.max(this.maxPos, pos);
        }
        updatePos(c.pos);
        card.pos.ee.on("change", updatePos);
        card.zone.ee.on("change", () => {
          card.damage(0);
          card.counters(0);
          card.offAdjust(0);
          card.defAdjust(0);
          card.inBattle(false);
          card.status("prepared");
        })
      })
      this.cardCount(this.cardCount() + cards.length);
    }

    cyclePhase(){
      let phase = this.phase();
      let change = {
        start: ["main", true, false, false],
        main: ["end", true, true, true],
        "battle-0": ["battle-1", true, false, false],
        "battle-1": ["battle-2", false, false, true],
        "battle-2": ["battle-3", false, false, false],
        "battle-3": ["battle-4", true, true, true],
        "battle-4": ["main", true, false, false],
        end: ["start", false, false, true],
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
      if(phase === "start")
        [...this.cards].filter(c => c.player() === this.turn()).map(c => {
          c.status("prepared");
          c.deploying(false);
        })
      if(phase === "end") {
        this.turn.toggle();
        this.o.gold(true);
        this.p.gold(true);
        [...this.cards].filter(c => c.damage()).map(c => c.damage(0))
      }
      if(phase === "battle-0")
        [...this.cards].filter(c => c.player() === this.turn() && c.inBattle()).map(c => c.status("expended"));
      if(phase === "battle-2")
        [...this.cards].filter(c => c.player() !== this.turn() && c.inBattle()).map(c => c.status("flipped"));
      if(phase === "battle-4")
        if(phase === "battle-4")
          [...this.cards].filter(c => c.zone() === "play" && c.inBattle()).map(c => {
            c.inBattle(false);
            if(!c.marked())
              return;
            c.zone("disc")
            c.pos(this.maxPos);
            c.marked(false);
          })
    }

    decyclePhase(){
      this.phase({
        start: "end",
        main: "start",
        end: "main",
        "battle-0": "main",
        "battle-1": "battle-0",
        "battle-2": "battle-1",
        "battle-3": "battle-2",
        "battle-4": "battle-3",
      }[this.phase()]);

      this.initiative(this.p.n);
      this.p.waitingOn(true);
      this.o.waitingOn(false);

      if(this.phase() === "end")
        this.turn.toggle();
    }

    smartPass(){
      this.p.waitingOn(false);
      if(!this.o.waitingOn())
        this.hideInitiative() || !this.willPass() ?
          this.canProceed() && this.cyclePhase() :
          this.canPass() && this.initiative.toggle()
    }

    blockingPass(){
      if(!this.p.hasTurn() && ["battle-1", "battle-2", "battle-3"].indexOf(this.phase()) && this.canProceed()) {
        this.cyclePhase();
        this.phase("battle-3");
        this.p.waitingOn(false);
        this.initiative(this.o.n);
      }
    }

    tokenMenu(n: boolean){
      return cardData.filter(o => o.packCode === "tokens").map(c => ({
        name: c.name,
        class: c.faction.toLowerCase(),
        func: () => {
          this.ws.s("newCard", c, n, n, "play", ++this.maxPos);
        }
      }))
    }

}

export default Game;
export type { Player, Phase, Card, LogEntry };
