/* @flow */

import React from "react";
import HPS from "./HPS";
import type { Props } from "./HPS";

const Discard = (props: Props) => {
  props.zone.use();
  let n = Math.ceil(Math.sqrt(props.zone().length));
  return <HPS {...props} className={`n${n} disc ` + (props.className || "")}/>
}

export default Discard;
