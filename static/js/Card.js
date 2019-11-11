/* @flow */

import React from "react";
import Game from "./Game";
import type { Card as CardType } from "./Game";
import rightClick from "./rightClick";
import moveFuncs from "./moveFuncs";
import type { MoveFunc } from "./moveFuncs";
import double from "./double";
import NumberBadge from "./NumberBadge";
import { useComputed as c, observer } from "rhobo";
import { previewCard } from "./CardPreview";
import Toggle from "./Toggle";

type b = boolean;

type Props = {
  game: Game,
  card: CardType,
  menu: Array<MoveFunc>,
  main?: MoveFunc,
  exec: (MoveFunc) => void,
}
const Card = observer<Props>(({ game, card, menu, main = moveFuncs.mark, exec }) => {
  let m = [moveFuncs.mark, ...menu].map(f => {
    let mf = f(game, card);
    return {
      ...mf,
      func: () => exec(f),
    };
  });
  return (
    <div className={
      (card.marked() ? "marked " : "") +
      (card.inBattle() ? "inBattle " : "") +
      (card.selected() ? "selected " : "") +
      "Card " +
      card.status()
    } onClick={double(
      () => exec(main),
      e => {
        if(e.ctrlKey)
          return card.selected.toggle();
        previewCard(card)
      },
    )} {...rightClick(m)}>
      <img className="_" src="/314x314.jpg"/>
      <img src={`/images/${card.card()?._id || "back"}`}/>
      <div className="badges">
        <NumberBadge value={card.damage} show={c<b>(() => !!card.damage())} className="damage"/>
        <NumberBadge value={card.counters} show={c<b>(() => !!card.counters())} className="counters"/>
        <NumberBadge value={card.off} show={c<b>(() => !!card.offAdjust() || !!card.counters())} className="off"/>
        <NumberBadge value={card.def} show={c<b>(() => !!card.defAdjust() || !!card.counters())} className="def"/>
        <NumberBadge value={card.offAdjust} className="offAdjust"/>
        <NumberBadge value={card.defAdjust} className="defAdjust"/>
        <Toggle className="deploying Badge" value={c<b>(() =>
          card.deploying() &&
          card.zone() === "play"
        ) } toggle={false}/>
        <Toggle className="revealed Badge" value={c<b>(() =>
          card.public() &&
          card.zone() === "hand" &&
          card.player() === game.p.n
        ) } toggle={false}/>
      </div>
    </div>
  )
});

export default Card;
