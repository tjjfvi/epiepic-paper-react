
import React from "react";
import Status from "./Status";
import Game from "./Game";

const App = () => {
  const game = new Game();
  return <div className="App">
    <div className="p user"/>
    <div className="p supp"/>
    <div className="p deck"/>
    <div className="p disc"/>
    <div className="p play"/>
    <div className="p hand"/>
    <div className="o user"/>
    <div className="o supp"/>
    <div className="o deck"/>
    <div className="o disc"/>
    <div className="o play"/>
    <div className="o hand"/>
    <Status game={game}/>
  </div>
}

export default App;
