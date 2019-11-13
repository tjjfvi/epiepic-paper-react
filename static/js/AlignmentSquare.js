// @flow

import React from "react";

const AlignmentSquare = ({ cards }: { cards: Array<any>}) => (
  <div className="AlignmentSquare" x={console.log(cards)}>
    {["good", "sage", "evil", "wild"].map(a =>
      <div key={a} className={a} style={(n => ({ width: n, height: n }))(
        Math.sqrt(cards.filter(c => c.faction.toLowerCase() === a).length / cards.length) * 50 + "%"
      )}/>
    )}
  </div>
)

export default AlignmentSquare;
