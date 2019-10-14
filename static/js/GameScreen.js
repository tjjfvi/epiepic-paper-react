/* @flow */

import React from "react";
import Status from "./Status";
import Game from "./Game";
import User from "./User";
import HPS from "./HPS";
import ws from "./ws";
import { useValue } from "./hobo";

const GameScreen = () => {
  const game = useValue(() => new Game(ws));
  game.ready.use();
  console.log(game.ready())
  if(!game.ready())
    return <div className="waiting">One moment...</div>;
  return <div className="Game">
    <User player={game.p} game={game}/>
    <HPS zone={game.p.zones.hand} className="p hand"/>
    <HPS zone={game.p.zones.play} className="p play"/>
    <HPS zone={game.p.zones.supp} className="p supp"/>
    <div className="p deck"/>
    <div className="p disc"/>
    <User player={game.o} game={game}/>
    <HPS zone={game.o.zones.hand} className="o hand"/>
    <HPS zone={game.o.zones.play} className="o play"/>
    <HPS zone={game.o.zones.supp} className="o supp"/>
    <div className="o deck"/>
    <div className="o disc"/>
    <Status game={game}/>
  </div>
}

export default GameScreen;
