/* @flow */

import React from "react";
import type { Observable } from "./hobo";

type Props = {
    value: Observable<number>,
    className?: string,
    show?: Observable<boolean>
}
const NumberBadge = ({ value, show, className = "" }: Props) => {
  value.use();
  let s = show ? show.use()() ? "show" : "hide" : "";
  return (
    <div className={s + " NumberBadge " + className} onClick={e => e.stopPropagation()}>
      <div className="Badge ">
        <span className="a" onClick={() => value.inc()}>+</span>
        <input onChange={e => value(+e.currentTarget.value)} value={value()}/>
        <span className="a" onClick={() => value.dec()}>–</span>
      </div>
    </div>
  )
}

export default NumberBadge;
