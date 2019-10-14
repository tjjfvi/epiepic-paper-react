
import React from "react";
import { useValue, useObservable } from "./hobo";
import ws from "./ws";
import DeckChoiceScreen from "./DeckChoiceScreen";
import { go } from "./App";

const Game = ({ game }) => {
  const wrong = useObservable(false).use();
  const input = React.useRef();
  return <div className={"game " + (game.pswd ? "pswd" : "")}>
    <span>
      <span>{game.name}</span>
    </span>
    <div>
      <input ref={input} className={wrong() ? "wrong" : ""}type="password" data-lpignore="true" placeholder="Password"/>
      <button onClick={() => {
        ws.s("join", game.id, input.current.value)
        let h = data => {
          if(data[0] !== "joinFailed")
            return;
          wrong(true);
          ws.removeListener("message", h)
        }
        ws.on("message", h);
      }}>Join</button>
    </div>
  </div>
};

const LobbyScreen = () => {
  const games = useValue(() => ws.observable([], ["games"])).use();
  const status = useValue(() => ws.observable(null, ["status"])).use();
  const input = React.useRef();
  if(status() === "playing")
    go(DeckChoiceScreen);
  return (
    status() === "hosting" ?
      <div className="waiting">Waiting for someone to join...</div> :
      <div className="Lobby">
        <div className="join">
          <h1>Join an existing game</h1>
          {games().map((game, i) => <Game game={game} key={i}/>)}
        </div>
        <div className="host">
          <h1>Host a new game</h1>
          <label>
            <span>Password <i>(optional)</i></span>
            <input ref={input} type="password" data-lpignore="true"/>
          </label>
          <button onClick={() => {
            ws.s("host", "test", input.current.value);
          }}>Host</button>
        </div>
      </div>
  )
}

export default LobbyScreen;
