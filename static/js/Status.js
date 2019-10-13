/* @flow */

import React from "react";
import { useObservable } from "./hobo";
import Toggle from "./Toggle";

const Status = () => {
  const waitingOn = useObservable<boolean>(false);
  return (
    <div className="status">
      <div className="o">
        <Toggle className="waitingOn o" value={waitingOn}/>
        <div className="attention o true"/>
        <div className="initiative o true"/>
      </div>
      <div className="tp">
        <span className="turn">Their turn</span>
        <span className="phase">Main phase</span>
      </div>
      <div className="p">
        <div className="initiative p true"/>
        <div className="attention p true"/>
        <div className="waitingOn p true"/>
      </div>
    </div>
  );
}

export default Status;
