// @flow

import React from "react";
import ws from "./ws";
import CardPreview, { previewCard } from "./CardPreview";
import { useValue, useObservable, useComputed, observer } from "rhobo";
import { status, go } from "./App";
import GameScreen from "./GameScreen";
import AlignmentSquare from "./AlignmentSquare";

const DraftCard = ({ id, onClick, selected = false }: { id: number, onClick: () => void, selected?: boolean }) => (
  <div className={"DraftCard " + (selected ? "selected" : "")} onClick={onClick}>
    <img className="_" src="/1800x334.jpg"/>
    <img src={`/images/${id}`}/>
  </div>
);
const DraftScreen = observer<{}>(() => {
  const phase = useValue(() => ws.observable(0, ["phase"]));
  const hand = useValue(() => ws.observable<Array<any>>([], ["hand"]));
  const deck = useValue(() => ws.observable<Array<any>>([], ["deck"]));
  const passed = useValue(() => ws.observable<Array<any>>([], ["passed"]));
  const burnt = useValue(() => ws.observable<Array<any>>([], ["burnt"]));
  const selected = useObservable<Array<any>>([]);
  const enabled = useComputed(() => selected().length === (phase() % 2 + 1));
  const active = useObservable<number>(2);
  if(status() === "playing")
    go(GameScreen);
  return <div className="Draft">
    <CardPreview/>
    <span className="title">{`Pack ${Math.floor(phase() / 2) + 1}, Pick ${phase() % 2 + 1}`}</span>
    {hand().length ? <div className="hand">
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
    </div> : <div className="hand waiting"><span>Waiting for opponent...</span></div>}
    <div className="side">
      {[passed, burnt, deck].map((cs, i) =>
        <div
          key={i}
          className={active() === i ? "active" : ""}
          onClick={() => active(i)}
        >
          <div className="side">
            <span>{["Passed", "Burnt", "Deck"][i]}</span>
            <AlignmentSquare cards={cs()}/>
          </div>
          <div className="cards">
            {cs().map(c => <DraftCard key={c._id} id={c._id} onClick={() => previewCard(c)}/>)}
          </div>
        </div>
      )}
    </div>
    <button className={"nav " + (enabled() ? "enabled" : "")} onClick={() => {
      if(!enabled())
        return;
      ws.s("select", selected());
      let rest = hand().filter(c => !selected().includes(c));
      deck().push(...selected());
      (phase() % 2 ? burnt : passed)().push(...rest);
      selected([]);
      hand([]);
      deck.to();
    }}>Continue</button>
  </div>
});

export default DraftScreen;
