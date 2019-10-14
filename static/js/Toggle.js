/* @flow */

import React from "react";
import type { Observable } from "./hobo";

type Props = {
    value: Observable<boolean>,
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
  value.use();
  return <div
    className={className + " " + (value() ?? "").toString()}
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
