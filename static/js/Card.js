/* @flow */

import React from "react";
import Game from "./Game";
import type { Card as CardType } from "./Game";
import rightClick from "./rightClick";
import type { MoveFunc } from "./moveFuncs";
import double from "./double";

type Props = {
  game: Game,
  card: CardType,
  menu: Array<MoveFunc>,
  main?: MoveFunc,
}
const Card = ({ game, card, menu, main }: Props) => {
  card.card.use();
  let m = menu.map(f => f(game, card));
  return (
    <div className="Card" onClick={double(
      () => main && main(game, card).func(),
      () => {},
    )} {...rightClick(m)}>
      <img className="_" src="/314x314.jpg"/>
      <img src={`/images/${card.card()?._id || "back"}`}/>
    </div>
  )
}

export default Card;
