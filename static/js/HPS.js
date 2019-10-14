/* @flow */

import React from "react";
import type { Card as CardType } from "./Game"
import type { Observable } from "./hobo";
import Card from "./Card";

type Props = {
    zone: Observable<Array<CardType>>,
    className?: string,
}

const HPS = ({ zone, className }: Props) => {
  zone.use();
  return (
    <div className={"HPS " + (className || "")}>
      {zone().map(c => <Card key={c.id} card={c}/>)}
    </div>
  )
}

export default HPS;
