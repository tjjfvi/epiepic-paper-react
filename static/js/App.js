
import React from "react";
import { observable } from "rhobo";
import LobbyScreen from "./LobbyScreen";
import { RightClickMenu, appEventBindings } from "./rightClick";
import { observer } from "rhobo";

import "./hoverIntent";
import "./registerSW";
import "./styleReload";

const screen = observable(LobbyScreen);
const go = x => screen(x);

const App = observer(() => {
  const Screen = screen();
  return <div {...appEventBindings}>
    <Screen/>
    <RightClickMenu/>
  </div>;
});

export default App;
export { go };
