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
    <div className={"HPS " + (className || "")} {...rightClick(game.spectating ? [] : [
      { name: "Select All", func: () => zone().map(c => c.selected(true)) },
      ...menu
    ])}>
      {zone().map(c => {
        let exec = f => {
          if(zone().some(c => c.selected()))
            zone().filter(c => c.selected()).map(c => {
              c.selected(false);
              f(game, c).func()
            });
          else
            f(game, c).func();
        };
        return <Card game={game} main={main} menu={cardMenu} key={c.id} card={c} exec={exec}/>
      })}
    </div>
  )
}

export default HPS;
export type { Props };
