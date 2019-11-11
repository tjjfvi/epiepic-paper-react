/* @flow */

import React from "react";
import { useObservable } from "rhobo";
import ws from "./ws";
import { go } from "./App";
import GameScreen from "./GameScreen";

const DeckChoiceScreen = () => {
  const wrong = useObservable(false).use();
  const textarea = React.useRef();
  return (
    <div className="DeckChoice">
      <textarea className={wrong() ? "wrong" : ""} ref={textarea} placeholder="Deck ID or Deck List">30 Muse</textarea>
      <button onClick={async () => {
        const re = /^(?:http.*id=)?([0-9a-f]+)(?:&.*)?$/;
        let input = (textarea.current?.value || "").trim();
        let [, deckId] = input.match(re) || [];
        let cards = await (
          deckId ?
            fetch(`/api/deck:${deckId}`).then(r => r.json()).then(d => d.cards) :
            fetch(`/api/deck/parseList`, {
              method: "POST",
              body: input
            }).then(r => r.json())
        ).catch(() => void wrong(true));
        ws.s("deck", cards);
        go(GameScreen);
      }}>Submit</button>
    </div>
  );
};

export default DeckChoiceScreen;
