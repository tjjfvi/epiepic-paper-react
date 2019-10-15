
import React from "react";
import { observable } from "./hobo";
import LobbyScreen from "./LobbyScreen";
import { RightClickMenu } from "./rightClick";

const screen = observable(LobbyScreen);
const go = x => screen(x);

const App = () => {
  screen.use();
  const Screen = screen();
  return <>
    <Screen/>
    <RightClickMenu/>
  </>;
}

export default App;
export { go };
