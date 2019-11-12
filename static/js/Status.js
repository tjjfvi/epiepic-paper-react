/* @flow */

import React from "react";
import Toggle from "./Toggle";
import Game from "./Game";
import { observer, useValue } from "rhobo";
import type { Observable } from "rhobo";
import double from "./double";
import rightClick from "./rightClick";

const tpMenu = (game: Game) => [{
  name: "Pass",
  func: () => game.canPass() && game.initiative.toggle(),
}, {
  name: "Blocking Pass",
  func: () => game.blockingPass(),
}, {
  name: "Next phase",
  func: () => game.cyclePhase(),
}, {
  name: "Previous phase",
  func: () => game.decyclePhase(),
}, {
  name: "Next turn",
  func: () => (game.phase("end"), game.cyclePhase()),
}, ...Game.phases.map(p => ({
  name: Game.phaseNames[p],
  func: () => {
    game.phase(p);
    game.initiative(game.p.n);
    game.o.waitingOn(false);
    game.p.waitingOn(true);
  }
}))]

type Props = {
  game: Game,
}
const Status = ({ game }: Props) => {
  let { spectating: lock } = game;
  return <div className={"status " + (lock ? "lock" : "")}>
    <div className="o">
      <Toggle className="waitingOn o" value={game.o.waitingOn} toggleOff={false} toggle={lock}/>
      <Toggle className="attention o" value={game.o.attention} toggle={lock}/>
      <Toggle className="initiative o" hide={game.hideInitiative} value={game.o.hasInitiative} toggle={false}/>
    </div>
    <TP game={game} lock={lock}/>
    <div className="p">
      <Toggle className="initiative p" hide={game.hideInitiative} value={game.p.hasInitiative} toggle={false}/>
      <Toggle className="attention p" value={game.p.attention} toggleOn={false} toggle={lock}/>
      <Toggle className="waitingOn p" value={game.p.waitingOn} toggle={lock}/>
    </div>
  </div>
}
const TP = observer<Props & { lock: boolean }>(({ game, lock }) => {
  const menu = useValue(() => tpMenu(game));
  return <div className={
    (lock ? "lock " : "") +
    (game.p.hasTurn() ? "pTurn " : "") +
    " tp " +
    (["canProceed", "willProceed", "shouldProceed"]).map(k =>
      (game: { [typeof k]: Observable<boolean> })[k]() ? k : ""
    ).join(" ")
  } onClick={double(() => !lock && game.smartPass())} {...rightClick(menu)}>
    <span className="turn">{game.p.hasTurn() ? "Your turn" : "Their turn"}</span>
    <span className="phase">{game.phaseName()}</span>
  </div>
})

export default Status;
