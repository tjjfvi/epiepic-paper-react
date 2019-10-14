/* @flow */

import React from "react";
import type { Player } from "./Game";
import double from "./double";

type Props = {
    player: Player,
    className: string,
}
const Deck = ({ player, className }: Props) => {
  player.zones.deck.use();
  return (
    <div className={"deck " + className} onClick={double(() => {
      let card = player.zones.deck().slice(-1)[0];
      card.pos(++player.game.maxPos);
      card.zone("hand");
    }, () => {})}>
      <img src={player.zones.deck().length ? "/images/back" : ""}/>
    </div>
  )
}

export default Deck;
