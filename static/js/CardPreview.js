// @flow

import React from "react";
import { observable } from "rhobo";
import type { Card } from "./Game";

const card = observable();
const showCard = observable(false);

const CardPreview = () => {
  card.use();
  showCard.use();
  let c = card();
  return <div className={(showCard() ? "" : "hide") + " CardPreview"} onClick={() => showCard(false)}>
    {c && <img src={`/images/${c._id || "back"}`}/>}
  </div>
}

const previewCard = (c: Card) => {
  card(c.card());
  showCard(true);
}

export default CardPreview;
export { previewCard };
