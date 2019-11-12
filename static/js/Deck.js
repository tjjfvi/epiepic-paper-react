/* @flow */

import React from "react";
import type { Player } from "./Game";
import double from "./double";
import { observer, computed } from "rhobo";
import rightClick from "./rightClick";

type Props = {
    player: Player,
    className: string,
}
const Deck = observer<Props>(({ player, className }) => {
  let { spectating } = player.game;
  let draw = (zone = "hand") => {
    if(spectating)
      return;
    if(player !== player.game.p)
      return;
    let card = player.zones.deck().slice(-1)[0];
    card.pos(player.game.maxPos + 1);
    card.zone(zone);
  }
  let menu = player === player.game.p && !spectating ? [
    {
      name: "Unbanish",
      func: () => {
        let card = player.zones.deck()[0];
        card.pos(player.game.maxPos + 1);
        card.zone("hand");
      }
    },
    {
      name: "Reveal",
      func: () => draw("supp")
    },
    {
      name: "Reveal 3",
      func: () => [...Array(3)].map(() => draw("supp")),
    },
    {
      name: "Reveal 5",
      func: () => [...Array(5)].map(() => draw("supp")),
    },
    {
      name: "Draw 5",
      func: () => [...Array(5)].map(() => draw()),
      show: computed(() => player.zones.hand().length === 0),
    },
  ] : [];
  return <div
    className={"deck " + className}
    onClick={double(() => draw(), () => {})}
    {...rightClick(menu)}
  >
    <img src={player.zones.deck().length ? "/images/back" : ""}/>
    <div className="cardCount countDeck">{player.zones.deck().length}</div>
    <div className="cardCount countHand">{player.zones.hand().length}</div>
    <div className="cardCount countDisc">{player.zones.disc().length}</div>
  </div>
})

export default Deck;
