/* @flow */

import Game from "./Game";
import type { Card } from "./Game";
import { computed } from "./hobo";
import type { MenuItem } from "./rightClick";

type MoveFunc = (Game, Card) => MenuItem;

const moveFuncs = {};

Game.zones.map(zone => {
  moveFuncs[zone] = (game: Game, card: Card) => ({
    name: {
      ...Game.zoneNames,
      play: "In-Play",
      deck: "Top of Deck",
      disc: card.zone() === "play" ? "Break" : "Discard",
    }[zone],
    func: () => {
      card.pos(game.maxPos + 1);
      card.zone(zone);
    },
    class: {
      play: "",
      deck: "",
      supp: "",
      disc: "evil",
      hand: "sage",
    }[zone],
  });
})

moveFuncs.banish = (game: Game, card: Card) => ({
  name: "Banish",
  func: () => {
    card.pos(game.minPos - 1);
    card.zone("deck");
  },
  class: "good",
});

moveFuncs.playCard = (game: Game, card: Card) => ({
  name: "Play",
  func: () => {
    card.pos(game.maxPos + 1);
    card.zone(card.card().type[0] === "C" ? "play" : "supp");
  },
  show: computed(() => !!card.card()),
})

const canPlayCard = (game, card) =>
  card.zone() === "hand" &&
  card.player() === game.p.n &&
  card.card() &&
  game.p.hasInitiative() &&
  (!card.card().cost || game.p.gold());
moveFuncs.playCardGold = (game: Game, card: Card) => ({
  name: "Auto-Play",
  func: () => {
    if(!canPlayCard(game, card))
      return;
    moveFuncs.playCard(game, card).func();
    if(!card.card().cost)
      return;
  },
  show: computed(() => canPlayCard(game, card)),
});

Game.cardStatuses.map(status => {
  let word = {
    prepared: "prepare",
    expended: "expend",
    flipped: "flip",
  }[status];
  moveFuncs[word] = (game: Game, card: Card) => ({
    name: word[0].toUpperCase() + word.slice(1),
    func: () => {
      card.status(status);
    },
    show: computed(() => card.status() !== status),
  })
});

let canBattle = (game: Game, card: Card) =>
  card.inBattle() ||
    ((
      (game.p.hasTurn() && !!~["main", "battle-0"].indexOf(game.phase())) ||
      (game.o.hasTurn() && game.phase() === "battle-1")
    ) && !game.o.waitingOn() && game.p.hasInitiative())
moveFuncs.battle = (game: Game, card: Card) => ({
  name: "Battle",
  func: () => {
    if(!canBattle(game, card))
      return;
    card.inBattle.toggle();
    if(game.phase() === "main" && card.inBattle()) {
      game.phase("battle-0");
      game.p.waitingOn(true);
      game.o.waitingOn(false);
    }
  },
  show: computed(() => canBattle(game, card)),
});

(moveFuncs: {[string]: MoveFunc})

export default moveFuncs;
export type { MoveFunc };
