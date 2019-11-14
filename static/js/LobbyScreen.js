
import React from "react";
import { useValue, useObservable, observable, observer } from "rhobo";
import ws from "./ws";
import DeckChoiceScreen from "./DeckChoiceScreen";
import GameScreen from "./GameScreen";
import DraftScreen from "./DraftScreen";
import { UploadButton } from "./registerSW";
import { go, status } from "./App";

const modes = ["constructed", "draft", "rmr30"];
const modeNames = {
  constructed: "Constructed",
  draft: "Draft",
  rmr30: "R30, Mono, Random",
};
const mode = observable("");

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
    <span>{modeNames[game.mode || "constructed"]}</span>
    <div>
      <input ref={input} className={wrong() ? "wrong" : ""}type="password" data-lpignore="true" placeholder="Password"/>
      <button onClick={() => {
        ws.s(isReconnect ? "reconnect" : isSpectate ? "spectate" : "join", game.id, input.current.value)
        mode(game.mode);
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
  const oldStatus = useObservable(status());
  const games = useValue(() => ws.observable([], ["games"]));
  const reconnectGames = useValue(() => ws.observable([], ["reconnectGames"]));
  const spectateGames = useValue(() => ws.observable([], ["spectateGames"]));
  const input = React.useRef();
  const select = React.useRef();
  if(status() === "spectating" || (status() === "playing" && (oldStatus.val !== "" || mode() === "rmr30")))
    go(GameScreen);
  else if(status() === "drafting")
    go(DraftScreen);
  else if(status() === "playing" && (!mode() || mode() === "constructed"))
    go(DeckChoiceScreen);
  else oldStatus(status())
  return (
    status() === "hosting" ?
      <div className="waiting">Waiting for someone to join...</div> :
      status() === "reconnecting" ?
        <div className="waiting">One moment...</div> :
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
                {modes.map(m => <option key={m} value={m}>{modeNames[m]}</option>)}
              </select>
            </label>
            <button onClick={() => {
              mode(select.current.value);
              ws.s("host", input.current.value, select.current.value);
            }}>Host</button>
          </div>
        </div>
  )
});

export default LobbyScreen;
