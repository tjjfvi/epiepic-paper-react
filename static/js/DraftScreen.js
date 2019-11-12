// @flow

import React from "react";
import ws from "./ws";
import CardPreview, { previewCard } from "./CardPreview";
import { useValue, useObservable, useComputed, observer } from "rhobo";
import { status, go } from "./App";
import GameScreen from "./GameScreen";

const DraftCard = ({ id, onClick, selected = false }: { id: number, onClick: () => void, selected?: boolean }) => (
  <div className={"DraftCard " + (selected ? "selected" : "")} onClick={onClick}>
    <img src={`/images/${id}`}/>
  </div>
);
const DraftScreen = observer<{}>(() => {
  const hand = useValue(() => ws.observable<Array<any>>([], ["hand"]));
  const phase = useValue(() => ws.observable(0, ["phase"]));
  const deck = useObservable<Array<any>>([]);
  const selected = useObservable<Array<any>>([]);
  const enabled = useComputed(() => selected().length === (phase() % 2 + 1));
  if(status() === "playing")
    go(GameScreen);
  return <div className="Draft">
    <CardPreview/>
    <span className="title">{`Pack ${Math.floor(phase() / 2) + 1}, Pick ${phase() % 2 + 1}`}</span>
    <div className="hand">
      {hand().map(c => <DraftCard key={c._id} id={c._id} onClick={() => {
        if(selected().includes(c)) {
          selected().splice(selected().indexOf(c), 1);
          selected.to();
          return;
        }
        if(enabled())
          selected().shift();
        selected().push(c);
        selected.to();
      }} selected={selected().includes(c)}/>)}
    </div>
    <div className="deck">
      <div>
        {deck().map(c => <DraftCard key={c._id} id={c._id} onClick={() => previewCard(c)}/>)}
      </div>
    </div>
    <button className={"nav " + (enabled() ? "enabled" : "")} onClick={() => {
      if(!enabled())
        return;
      ws.s("select", selected());
      deck().push(...selected());
      selected([]);
      hand([]);
      deck.to();
    }}>Continue</button>
  </div>
});

export default DraftScreen;
