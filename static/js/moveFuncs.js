/* @flow */

import Game from "./Game";
import type { Card } from "./Game";
import { computed } from "rhobo";
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
      card.player(card.owner);
      card.pos(game.maxPos + 1);
      card.zone(zone);
    },
    class: {
      play: "",
      deck: "",
      supp: "",
      disc: "evil",
      hand: "sage",
      none: "",
      banish: "",
    }[zone],
  });
})

moveFuncs.banish = (game: Game, card: Card) => ({
  name: "Banish",
  func: () => {
    card.pos(game.minPos - 1);
    card.zone("banish");
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
  !game.hideInitiative() &&
  (!card.card().cost || (game.p.gold() === true || game.p.gold() === card.card().factionCode));
moveFuncs.playCardGold = (game: Game, card: Card) => ({
  name: "Auto-Play",
  func: () => {
    if(!canPlayCard(game, card))
      return;
    moveFuncs.playCard(game, card).func();
    if(card.card().cost)
      game.p.gold(false);
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
      (game.o.hasTurn() && game.phase() === "battle-2")
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

moveFuncs.mark = (game: Game, card: Card) => ({
  name: computed(() => card.marked() ? "Unmark" : "Mark"),
  func: () => {
    card.marked.toggle();
  }
});

moveFuncs.reveal = (game: Game, card: Card) => ({
  name: computed(() => card.public() ? "Unreveal" : "Reveal"),
  func: () => {
    card.public.toggle();
  }
});

moveFuncs.changeControl = (game: Game, card: Card) => ({
  name: "Change Control",
  func: () => {
    card.player.toggle()
    card.zone("play")
    card.pos(game.maxPos + 1);
  },
});

moveFuncs.transform = (game: Game, card: Card) => ({
  name: "Transform",
  func: () => {
    let p = card.player();
    moveFuncs.banish(game, card).func();
    game.tokenMenu(p).find(x => x.name === "Wolf Token").func();
  },
  class: "wild",
});

(moveFuncs: {[string]: MoveFunc})

export default moveFuncs;
export type { MoveFunc };
