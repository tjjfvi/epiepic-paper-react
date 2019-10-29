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
  player.zones.hand.use();
  player.zones.disc.use();
  return (
    <div className={"deck " + className} onClick={double(() => {
      let card = player.zones.deck().slice(-1)[0];
      card.pos(player.game.maxPos + 1);
      card.zone("hand");
    }, () => {})}>
      <img src={player.zones.deck().length ? "/images/back" : ""}/>
      <div className="cardCount countDeck">{player.zones.deck().length}</div>
      <div className="cardCount countHand">{player.zones.hand().length}</div>
      <div className="cardCount countDisc">{player.zones.disc().length}</div>
    </div>
  )
}

export default Deck;
