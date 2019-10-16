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
  let input = React.useRef();
  const f = () => input.current && input.current.focus();
  return (
    <div className={s + " NumberBadge " + className} onClick={f}>
      <div className="Badge ">
        <span className="a" onClick={() => (value.inc(), f())}>+</span>
        <input ref={input} onChange={e => value(+e.currentTarget.value)} value={value()}/>
        <span className="a" onClick={() => (value.dec(), f())}>–</span>
      </div>
    </div>
  )
}

export default NumberBadge;
