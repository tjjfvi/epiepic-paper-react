
import React from "react";

const Status = () => {
  const x = 5;
  return (
    <div className="status">
      <div className="o">
        <div className="waitingOn o on"/>
        <div className="attention o on"/>
        <div className="initiative o on"/>
      </div>
      <div className="tp">
        <span className="turn">Their turn</span>
        <span className="phase">Main phase</span>
      </div>
      <div className="p">
        <div className="initiative p on"/>
        <div className="attention p on"/>
        <div className="waitingOn p on"/>
      </div>
    </div>
  );
}

export default Status;
