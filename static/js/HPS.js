/* @flow */

import React from "react";
import Game from "./Game";
import type { Card as CardType } from "./Game"
import type { Observable } from "./hobo";
import Card from "./Card";
import type { MoveFunc } from "./moveFuncs";

type Props = {
  game: Game,
  zone: Observable<Array<CardType>>,
  className?: string,
  menu: Array<MoveFunc>,
}

const HPS = ({ game, zone, className, menu }: Props) => {
  zone.use();
  return (
    <div className={"HPS " + (className || "")}>
      {zone().map(c => <Card game={game} menu={menu} key={c.id} card={c}/>)}
    </div>
  )
}

export default HPS;
export type { Props };
