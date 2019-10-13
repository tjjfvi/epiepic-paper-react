/* @flow */

import React from "react";
import Toggle from "./Toggle";
import Game from "./Game";

type Props = {
  game: Game,
}
const Status = ({ game }: Props) => (
  <div className="status">
    <div className="o">
      <Toggle className="waitingOn o" value={game.o.waitingOn} toggleOff={false}/>
      <Toggle className="attention o" value={game.o.attention}/>
      <Toggle className="initiative o" value={game.o.hasInitiative} toggle={false}/>
    </div>
    <TP game={game}/>
    <div className="p">
      <Toggle className="initiative p" value={game.p.hasInitiative} toggle={false}/>
      <Toggle className="attention p" value={game.p.attention} toggleOn={false}/>
      <Toggle className="waitingOn p" value={game.p.waitingOn}/>
    </div>
  </div>
)
const TP = ({ game }: Props) => {
  game.p.hasTurn.use();
  game.phaseName.use();
  return <div className="tp" onClick={() => game.cyclePhase()}>
    <span className="turn">{game.p.hasTurn() ? "Your turn" : "Their turn"}</span>
    <span className="phase">{game.phaseName()}</span>
  </div>
}

export default Status;
