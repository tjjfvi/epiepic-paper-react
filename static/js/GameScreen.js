/* @flow */

import React from "react";
import Status from "./Status";
import Game from "./Game";
import User from "./User";
import HPS from "./HPS";
import Deck from "./Deck";
import ws from "./ws";
import { useValue } from "./hobo";
import moveFuncs from "./moveFuncs";

const GameScreen = () => {
  const game = useValue(() => new Game(ws));
  game.ready.use();
  console.log(game.ready())
  if(!game.ready())
    return <div className="waiting">One moment...</div>;
  return <div className="Game">
    <User player={game.o} game={game}/>
    <HPS menu={[]} game={game} zone={game.o.zones.hand} className="o hand"/>
    <HPS menu={[]} game={game} zone={game.o.zones.play} className="o play"/>
    <HPS menu={[]} game={game} zone={game.o.zones.supp} className="o supp"/>
    <Deck player={game.o} className="o"/>
    <div className="o disc"/>

    <User player={game.p} game={game}/>
    <HPS menu={[
      moveFuncs.playCardGold,
      moveFuncs.disc,
      moveFuncs.supp,
      moveFuncs.play,
      moveFuncs.deck,
      moveFuncs.banish,
    ]} game={game} zone={game.p.zones.hand} className="p hand"/>
    <HPS menu={[
      moveFuncs.supp,
      moveFuncs.banish,
      moveFuncs.hand,
      moveFuncs.disc,
    ]} game={game} zone={game.p.zones.play} className="p play"/>
    <HPS menu={[
      moveFuncs.disc,
      moveFuncs.play,
      moveFuncs.hand,
      moveFuncs.banish,
    ]} game={game} zone={game.p.zones.supp} className="p supp"/>
    <Deck player={game.p} className="p"/>
    <div className="p disc"/>

    <Status game={game}/>
  </div>
}

export default GameScreen;
