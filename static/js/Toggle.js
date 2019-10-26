/* @flow */

import React from "react";
import type { Observable } from "rhobo";

type Props = {
    value: Observable<boolean>,
    hide?: Observable<boolean>,
    className?: string,
    toggle?: boolean,
    toggleOn?: boolean,
    toggleOff?: boolean,
}

const Toggle = ({
  value,
  className = "",
  toggle = true,
  toggleOn = true,
  toggleOff = true,
  ...props
}: Props) => {
  let hide = props.hide ? props.hide.use()() : false;
  value.use();
  return <div
    className={(hide ? "hide " : "") + className + " " + (value() ?? "").toString()}
    onClick={() => {
      if(!toggle) return;
      if(value() && !toggleOff) return;
      if(!value() && !toggleOn) return;
      value.toggle();
    }}
    {...props}
  />
}

export default Toggle;
