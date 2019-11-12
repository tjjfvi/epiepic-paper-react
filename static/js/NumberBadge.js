/* @flow */

import React from "react";
import type { Observable } from "rhobo";

type Props = {
    lock?: boolean,
    value: Observable<number>,
    className?: string,
    show?: Observable<boolean>
}
const NumberBadge = ({ lock = false, value, show, className = "" }: Props) => {
  value.use();
  let s = show ? show.use()() ? "show" : "hide" : "";
  return (
    <div className={(lock ? "lock " : "") + s + " NumberBadge " + className} onClick={e => e.stopPropagation()}>
      <div className="Badge ">
        {!lock && <span className="a" onClick={() => value.inc()}>+</span>}
        <input onChange={e => value(+e.currentTarget.value)} value={value()} disabled={lock}/>
        {!lock && <span className="a" onClick={() => value.dec()}>–</span>}
      </div>
    </div>
  )
}

export default NumberBadge;
