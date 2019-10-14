/* @flow */

import React from "react";
import Status from "./Status";
import Game from "./Game";
import ws from "./ws";
import { useValue } from "./hobo";

const GameScreen = () => {
  const game = useValue(() => new Game(ws));
  game.ready.use();
  console.log(game.ready())
  if(!game.ready())
    return <div className="waiting">One moment...</div>;
  return <div className="Game">
    <div className="p user"/>
    <div className="p supp"/>
    <div className="p deck"/>
    <div className="p disc"/>
    <div className="p play"/>
    <div className="p hand"/>
    <div className="o user"/>
    <div className="o supp"/>
    <div className="o deck"/>
    <div className="o disc"/>
    <div className="o play"/>
    <div className="o hand"/>
    <Status game={game}/>
  </div>
}

export default GameScreen;
