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
const Status = ({ game }: Props) => (
  <div className="status">
    <div className="o">
      <Toggle className="waitingOn o" value={game.o.waitingOn} toggleOff={false}/>
      <Toggle className="attention o" value={game.o.attention}/>
      <Toggle className="initiative o" hide={game.hideInitiative} value={game.o.hasInitiative} toggle={false}/>
    </div>
    <TP game={game}/>
    <div className="p">
      <Toggle className="initiative p" hide={game.hideInitiative} value={game.p.hasInitiative} toggle={false}/>
      <Toggle className="attention p" value={game.p.attention} toggleOn={false}/>
      <Toggle className="waitingOn p" value={game.p.waitingOn}/>
    </div>
  </div>
)
const TP = observer<Props>(({ game }) => {
  const menu = useValue(() => tpMenu(game));
  return <div className={
    (game.p.hasTurn() ? "pTurn " : "") +
    " tp " +
    (["canProceed", "willProceed", "shouldProceed"]).map(k =>
      (game: { [typeof k]: Observable<boolean> })[k]() ? k : ""
    ).join(" ")
  } onClick={double(() => game.smartPass())} {...rightClick(menu)}>
    <span className="turn">{game.p.hasTurn() ? "Your turn" : "Their turn"}</span>
    <span className="phase">{game.phaseName()}</span>
  </div>
})

export default Status;
