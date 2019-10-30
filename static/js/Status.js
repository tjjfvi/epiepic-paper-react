/* @flow */

import React from "react";
import Toggle from "./Toggle";
import Game from "./Game";
import { observer } from "rhobo";
import type { Observable } from "rhobo";
import double from "./double";

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
const TP = observer<Props>(({ game }) =>
  <div className={
    (game.p.hasTurn() ? "pTurn " : "") +
    " tp " +
    (["canProceed", "willProceed", "shouldProceed"]).map(k =>
      (game: { [typeof k]: Observable<boolean> })[k]() ? k : ""
    ).join(" ")
  } onClick={double(() => game.smartPass())}>
    <span className="turn">{game.p.hasTurn() ? "Your turn" : "Their turn"}</span>
    <span className="phase">{game.phaseName()}</span>
  </div>
)

export default Status;
