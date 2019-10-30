/* @flow */

import React from "react";
import type { Player } from "./Game";
import double from "./double";
import { observer } from "rhobo";

type Props = {
    player: Player,
    className: string,
}
const Deck = observer<Props>(({ player, className }) => (
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
))

export default Deck;
