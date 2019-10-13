/* @flow */

import React from "react";
import type { Observable } from "./hobo";

type Props = {
    value: Observable<boolean>,
    className: string,
}

const Toggle = ({ value, className = "", ...props }: Props) => {
  value.use();
  return <div className={className + " " + value().toString()} onClick={() => value.toggle()} {...props}/>
}

export default Toggle;
