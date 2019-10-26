/* @flow */

import React from "react";
import Game from "./Game";
import type { Card as CardType } from "./Game"
import type { Observable } from "rhobo";
import Card from "./Card";
import type { MoveFunc } from "./moveFuncs";
import rightClick, { type MenuItem } from "./rightClick";

type Props = {
  game: Game,
  zone: Observable<Array<CardType>>,
  className?: string,
  menu?: Array<MenuItem>,
  cardMenu: Array<MoveFunc>,
  main?: MoveFunc,
}

const HPS = ({ game, zone, className, main, menu = [], cardMenu }: Props) => {
  zone.use();
  return (
    <div className={"HPS " + (className || "")} {...rightClick(menu)}>
      {zone().map(c => <Card game={game} main={main} menu={cardMenu} key={c.id} card={c}/>)}
    </div>
  )
}

export default HPS;
export type { Props };
