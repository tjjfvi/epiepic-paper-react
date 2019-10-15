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

(moveFuncs: {[string]: MoveFunc})

export default moveFuncs;
export type { MoveFunc };
