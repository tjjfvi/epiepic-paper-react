/* @flow */

import React from "react";
import type { Card as CardType } from "./Game";

type Props = {
    card: CardType,
}
const Card = ({ card }: Props) => {
  card.cardId.use();
  return (
    <div className="Card">
      <img className="_" src="/314x314.jpg"/>
      <img src={`/images/${card.cardId() || "back"}`}/>
    </div>
  )
}

export default Card;
