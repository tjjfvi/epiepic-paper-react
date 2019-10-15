/* @flow */

import React from "react";
import type { Card as CardType } from "./Game";
import rightClick from "./rightClick";

type Props = {
    card: CardType,
}
const Card = ({ card }: Props) => {
  card.cardId.use();
  return (
    <div className="Card" {...rightClick([
      {
        name: "Test",
        class: "test",
        func: () => {},
      }
    ])}>
      <img className="_" src="/314x314.jpg"/>
      <img src={`/images/${card.cardId() || "back"}`}/>
    </div>
  )
}

export default Card;
