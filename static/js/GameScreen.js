/* @flow */

import React from "react";
import Status from "./Status";
import Game from "./Game";
import User from "./User";
import HPS from "./HPS";
import Deck from "./Deck";
import Discard from "./Discard";
import ws from "./ws";
import { useValue } from "rhobo";
import moveFuncs from "./moveFuncs";

const GameStateHelper = ({ game }: { game: Game }) => <div className={
  (game.p.hasTurn.use()() ? "pTurn " : "oTurn ") +
  (game.p.hasInitiative.use()() ? "pInit " : "oInit ") +
  (game.p.gold.use()() ? "pGold " : "") +
  (game.o.gold.use()() ? "oGold " : "") +
""}/>;
const GameScreen = () => {
  const game = useValue(() => new Game(ws));
  game.ready.use();
  console.log(game.ready())
  if(!game.ready())
    return <div className="waiting">One moment...</div>;
  return <div className="Game">
    <GameStateHelper game={game}/>
    <User player={game.o} game={game}/>
    <HPS menu={[]} game={game} zone={game.o.zones.hand} className="o hand"/>
    <HPS menu={[]} game={game} zone={game.o.zones.play} className="o play"/>
    <HPS menu={[]} game={game} zone={game.o.zones.supp} className="o supp"/>
    <Deck player={game.o} className="o"/>
    <Discard menu={[]} game={game} zone={game.o.zones.disc} className="o"/>

    <User player={game.p} game={game}/>
    <HPS main={moveFuncs.playCardGold} menu={[
      moveFuncs.playCardGold,
      moveFuncs.disc,
      moveFuncs.supp,
      moveFuncs.play,
      moveFuncs.deck,
      moveFuncs.banish,
    ]} game={game} zone={game.p.zones.hand} className="p hand"/>
    <HPS main={moveFuncs.battle} menu={[
      moveFuncs.battle,
      moveFuncs.prepare,
      moveFuncs.expend,
      moveFuncs.flip,
      moveFuncs.supp,
      moveFuncs.banish,
      moveFuncs.hand,
      moveFuncs.disc,
    ]} game={game} zone={game.p.zones.play} className="p play"/>
    <HPS main={moveFuncs.disc} menu={[
      moveFuncs.disc,
      moveFuncs.play,
      moveFuncs.hand,
      moveFuncs.banish,
    ]} game={game} zone={game.p.zones.supp} className="p supp"/>
    <Deck player={game.p} className="p"/>
    <Discard main={moveFuncs.hand} menu={[
      moveFuncs.hand,
      moveFuncs.play,
      moveFuncs.banish,
    ]} game={game} zone={game.p.zones.disc} className="p"/>

    <Status game={game}/>
  </div>
}

export default GameScreen;
