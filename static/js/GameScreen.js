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
import CardPreview from "./CardPreview";
import { observer } from "rhobo";

const GameStateHelper = observer<{game: Game}>(({ game }) => <div className={
  (game.p.hasTurn() ? "pTurn " : "oTurn ") +
  (game.p.hasInitiative() ? "pInit " : "oInit ") +
  (game.p.gold() ? "pGold " : "") +
  (game.o.gold() ? "oGold " : "") +
""}/>);
const GameScreen = () => {
  const game = useValue(() => new Game(ws));
  game.ready.use();
  if(!game.ready())
    return <div className="waiting">One moment...</div>;
  const suppMenu = [
    moveFuncs.disc,
    moveFuncs.play,
    moveFuncs.hand,
    moveFuncs.changeControl,
    moveFuncs.banish,
  ];
  const playMenu = [
    moveFuncs.prepare,
    moveFuncs.expend,
    moveFuncs.flip,
    moveFuncs.battle,
    moveFuncs.changeControl,
    moveFuncs.supp,
    moveFuncs.banish,
    moveFuncs.hand,
    moveFuncs.disc,
    moveFuncs.transform,
  ];
  return <div className="Game">
    <GameStateHelper game={game}/>
    <User player={game.o} game={game} active={game.oActive}/>
    <HPS cardMenu={[]} game={game} zone={game.o.zones.hand} className="o hand"/>
    <HPS
      cardMenu={playMenu}
      menu={game.tokenMenu(game.o.n)}
      game={game}
      zone={game.o.zones.play}
      className="o play"
    />
    <HPS cardMenu={suppMenu} game={game} zone={game.o.zones.supp} className="o supp"/>
    <Deck player={game.o} className="o"/>
    <Discard cardMenu={[
      moveFuncs.banish,
      moveFuncs.changeControl,
      moveFuncs.hand,
    ]} game={game} zone={game.o.zones.disc} className="o"/>

    <User player={game.p} game={game}/>
    <HPS main={moveFuncs.playCardGold} cardMenu={[
      moveFuncs.playCardGold,
      moveFuncs.reveal,
      moveFuncs.disc,
      moveFuncs.supp,
      moveFuncs.play,
      moveFuncs.deck,
      moveFuncs.banish,
    ]} game={game} zone={game.p.zones.hand} className="p hand"/>
    <HPS
      main={moveFuncs.battle}
      cardMenu={playMenu}
      menu={game.tokenMenu(game.p.n)}
      game={game}
      zone={game.p.zones.play}
      className="p play"
    />
    <HPS main={moveFuncs.disc} cardMenu={suppMenu} game={game} zone={game.p.zones.supp} className="p supp"/>
    <Deck player={game.p} className="p"/>
    <Discard main={moveFuncs.hand} cardMenu={[
      moveFuncs.hand,
      moveFuncs.playCard,
      moveFuncs.banish,
    ]} game={game} zone={game.p.zones.disc} className="p"/>

    <Status game={game}/>

    <CardPreview/>
  </div>
}

export default GameScreen;
