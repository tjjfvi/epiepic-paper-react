/* @flow */

import React from "react";
import Game from "./Game";
import type { Card as CardType } from "./Game";
import rightClick from "./rightClick";
import type { MoveFunc } from "./moveFuncs";

type Props = {
  game: Game,
  card: CardType,
  menu: Array<MoveFunc>,
}
const Card = ({ game, card, menu }: Props) => {
  card.card.use();
  let m = menu.map(f => f(game, card));
  return (
    <div className="Card" {...rightClick(m)}>
      <img className="_" src="/314x314.jpg"/>
      <img src={`/images/${card.card()?._id || "back"}`}/>
    </div>
  )
}

export default Card;
