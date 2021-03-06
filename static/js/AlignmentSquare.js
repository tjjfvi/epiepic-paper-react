// @flow

import React from "react";

const AlignmentSquare = ({ cards, total = cards.length }: { cards: Array<any>, total?: number}) => (
  <div className="AlignmentSquare">
    {["good", "sage", "evil", "wild"].map(a =>
      <div key={a} className={a} style={(n => ({ width: n, height: n }))(
        Math.sqrt(cards.filter(c => c.faction.toLowerCase() === a).length / total) * 50 + "%"
      )}/>
    )}
  </div>
)

export default AlignmentSquare;
