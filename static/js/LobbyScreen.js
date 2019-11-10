
import React from "react";
import { useValue, useObservable, observer } from "rhobo";
import ws from "./ws";
import DeckChoiceScreen from "./DeckChoiceScreen";
import GameScreen from "./GameScreen";
import { UploadButton } from "./registerSW";
import { go } from "./App";

const Game = observer(({ game, isReconnect = false }) => {
  const wrong = useObservable(false);
  const input = React.useRef();
  return <div className={"game " + (game.pswd ? "pswd" : "")}>
    <span>
      <span>{game.oUser ? `@${game.oUser.username}#${game.oUser.discriminator}` : game.name}</span>
    </span>
    <div>
      <input ref={input} className={wrong() ? "wrong" : ""}type="password" data-lpignore="true" placeholder="Password"/>
      <button onClick={() => {
        ws.s(isReconnect ? "reconnect" : "join", game.id, input.current.value)
        let h = data => {
          if(data[0] !== "joinFailed")
            return;
          wrong(true);
          ws.removeListener("message", h)
        }
        ws.on("message", h);
      }}>{isReconnect ? "Reconnect" : "Join"}</button>
    </div>
  </div>
});

const LobbyScreen = observer(() => {
  const games = useValue(() => ws.observable([], ["games"]));
  const reconnectGames = useValue(() => ws.observable([], ["reconnectGames"]));
  const status = useValue(() => ws.observable(null, ["status"]));
  const input = React.useRef();
  if(status() === "reconnecting")
    go(GameScreen);
  if(status() === "playing")
    go(DeckChoiceScreen);
  return (
    status() === "hosting" ?
      <div className="waiting">Waiting for someone to join...</div> :
      <div className="Lobby">
        <UploadButton/>
        <div className="join">
          <h1>Join an existing game</h1>
          {games().map((game, i) => <Game game={game} key={i}/>)}
          {reconnectGames().map((game, i) => <Game game={game} isReconnect={true} key={i}/>)}
        </div>
        <div className="host">
          <h1>Host a new game</h1>
          <label>
            <span>Password <i>(optional)</i></span>
            <input ref={input} type="password" data-lpignore="true"/>
          </label>
          <button onClick={() => {
            ws.s("host", input.current.value);
          }}>Host</button>
        </div>
      </div>
  )
});

export default LobbyScreen;
