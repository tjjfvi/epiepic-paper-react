/* @flow */

import React from "react";
import { observable } from "rhobo";
import LobbyScreen from "./LobbyScreen";
import { RightClickMenu, appEventBindings } from "./rightClick";
import { observer } from "rhobo";
import ws from "./ws";

import "./hoverIntent";
import "./registerSW";
import "./styleReload";

const status = ws.observable<string>("", ["status"]);
const screen = observable<any => any>(LobbyScreen);
const go = (x: any=>any) => screen(x);

const App = observer<{}>(() => {
  const Screen = screen();
  return <div {...appEventBindings}>
    <Screen/>
    <RightClickMenu/>
  </div>;
});

export default App;
export { go, status };
