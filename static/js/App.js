
import React from "react";
import { observable } from "./hobo";
import LobbyScreen from "./LobbyScreen";

const screen = observable(LobbyScreen);
const go = x => screen(x);

const App = () => {
  screen.use();
  const Screen = screen();
  return <Screen/>;
}

export default App;
export { go };
