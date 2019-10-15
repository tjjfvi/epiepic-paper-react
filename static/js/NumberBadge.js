/* @flow */

import React from "react";
import type { Observable } from "./hobo";

type Props={
    value: Observable<number>,
    className?: string,
}
const NumberBadge = ({ value, className = "" }: Props) => {
  value.use();
  return (
    <div className={"NumberBadge " + className}>
      <div className="Badge ">
        <span className="a" onClick={() => value.inc()}>+</span>
        <input onChange={e => value(+e.currentTarget.value)} value={value()}/>
        <span className="a" onClick={() => value.dec()}>–</span>
      </div>
    </div>
  )
}

export default NumberBadge;
