
import React from "react";
import { observable } from "rhobo";
import LobbyScreen from "./LobbyScreen";
import { RightClickMenu, appEventBindings } from "./rightClick";

import "./hoverIntent";
import "./registerSW";

const screen = observable(LobbyScreen);
const go = x => screen(x);

const App = () => {
  screen.use();
  const Screen = screen();
  return <div {...appEventBindings}>
    <Screen/>
    <RightClickMenu/>
  </div>;
}

export default App;
export { go };
