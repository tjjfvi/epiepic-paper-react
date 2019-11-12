
import React from "react";
import { useValue, useObservable, observer } from "rhobo";
import ws from "./ws";
import DeckChoiceScreen from "./DeckChoiceScreen";
import GameScreen from "./GameScreen";
import DraftScreen from "./DraftScreen";
import { UploadButton } from "./registerSW";
import { go, status } from "./App";

const Game = observer(({ game, isReconnect = false, isSpectate = false }) => {
  const wrong = useObservable(false);
  const input = React.useRef();
  return <div className={"game " + (game.pswd ? "pswd" : "")}>
    <span>
      {isSpectate ?
        <>
          <span>{`@${game.p0.username}#${game.p0.discriminator}`}</span>
          <br/>
          <span>{`@${game.p1.username}#${game.p1.discriminator}`}</span>
        </> :
        <span>{game.oUser ? `@${game.oUser.username}#${game.oUser.discriminator}` : game.name}</span>
      }
    </span>
    <div>
      <input ref={input} className={wrong() ? "wrong" : ""}type="password" data-lpignore="true" placeholder="Password"/>
      <button onClick={() => {
        ws.s(isReconnect ? "reconnect" : isSpectate ? "spectate" : "join", game.id, input.current.value)
        let h = data => {
          if(data[0] !== "joinFailed")
            return;
          wrong(true);
          ws.removeListener("message", h)
        }
        ws.on("message", h);
      }}>{isReconnect ? "Reconnect" : isSpectate ? "Spectate" : "Join"}</button>
    </div>
  </div>
});

const LobbyScreen = observer(() => {
  const games = useValue(() => ws.observable([], ["games"]));
  const reconnectGames = useValue(() => ws.observable([], ["reconnectGames"]));
  const spectateGames = useValue(() => ws.observable([], ["spectateGames"]));
  const input = React.useRef();
  const select = React.useRef();
  if(status() === "reconnecting" || status() === "spectating")
    go(GameScreen);
  if(status() === "drafting")
    go(DraftScreen);
  if(status() === "playing")
    go(DeckChoiceScreen);
  return (
    status() === "hosting" ?
      <div className="waiting">Waiting for someone to join...</div> :
      <div className="Lobby">
        <UploadButton/>
        <div className="join">
          <h1>Join an existing game</h1>
          {reconnectGames().map((game, i) => <Game game={game} isReconnect key={i}/>)}
          {games().map((game, i) => <Game game={game} key={i}/>)}
          {spectateGames().map((game, i) => <Game game={game} isSpectate key={i}/>)}
        </div>
        <div className="host">
          <h1>Host a new game</h1>
          <label>
            <span>Password <i>(optional)</i></span>
            <input ref={input} type="password" data-lpignore="true"/>
          </label>
          <label>
            <span>Mode</span>
            <select ref={select}>
              <option value="constructed">Constructed</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <button onClick={() => {
            ws.s("host", input.current.value, select.current.value);
          }}>Host</button>
        </div>
      </div>
  )
});

export default LobbyScreen;
