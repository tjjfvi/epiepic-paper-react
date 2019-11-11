/* @flow */

import React from "react";
import rightClick from "./rightClick";
import Game from "./Game";
import type { LogEntry as LogEntryType } from "./Game";
import { useObservable } from "rhobo";
import { previewCard } from "./CardPreview";
import $ from "jquery";

type LogProps = {
    game: Game,
}
const Log = ({ game }: LogProps) => {
  const pinned = useObservable(true).use();
  game.log.use();
  return <div className={"Log " + (pinned() ? "pinned" : "")} {...rightClick([
    { name: "Toggle Hide", func: () => pinned.toggle() },
  ])}>
    <div>
      {game.log().map((l, i) => <LogEntry key={i} l={l} game={game}/>)}
    </div>
  </div>
}

type LogEntryProps = {
    l: LogEntryType,
    game: Game,
}
const LogEntry = ({ l, game }: LogEntryProps) => {
  const p = ` ${l.p === game.p.n ? "p" : "o"} `;
  const pName = x => ["Them", "You"][+(+x === +game.p.n)]
  const psName = x => ["Their", "Your"][+(+x === +game.p.n)]

  if(l.type === "newCard")
    return <>
      <CardName game={game} id={l.id}/>
      {" into " + psName(l.player).toLowerCase() + " " + Game.zoneNames[l.zone].toLowerCase()}
    </>;

  if(l.type !== "set")
    return <></>;

  if(l.path[0] === "card" && l.path[2] === "zone")
    return <div className={p}>
      <CardName game={game} id={l.path[1]}/>
      {" from " + Game.zoneNames[l.old].toLowerCase() + " to " + Game.zoneNames[l.val].toLowerCase()}
    </div>

  if(l.path[0] === "card" && l.path[2] === "player")
    return <div className={p}>
      <CardName game={game} id={l.path[1]}/>
      {" to " + pName(l.val).toLowerCase()}
    </div>

  if(l.path[0] === "turn")
    return <b>~ {psName(l.val)} Turn ~</b>;

  if(~["initiative", "phase"].indexOf(l.path[0]))
    return <i>{"\uD83E\uDC52"} {l.path[0] === "phase" ? Game.phaseNames[l.val] : pName(l.val)}</i>;

  let label = null;
  let val = l.val;

  if(l.path[0][0] === "p" && !!~["gold", "health"].indexOf(l.path[1])) {
    label = <> {psName(l.path[0][1])}{" "}{l.path[1]}</>;
    if(l.path[1] === "gold")
      val = (typeof l.val === "boolean" ? +l.val : "1" + l.val[0].toUpperCase()) + "";
  }
  if(l.path[0] === "card" && l.path[2] !== "pos")
    label = <>
      <CardName game={game} id={l.path[1]}/>
      {" "}
      {{
        damage: "damage",
        counters: "counters",
        offAdjust: "offense adjustment",
        defAdjust: "defense adjustment",
        status: "status",
      }[l.path[2]]}
    </>

  if(label)
    return <div className={p}>
      {label}{": "}
      {val + ""}
      {typeof val === "number" ? ` (${(val < l.old ? "-" : "+")}${Math.abs(l.old - val)})` : ""}
    </div>;

  return <></>;
}

type CardNameProps = {
    game: Game,
    id: string,
};
const CardName = ({ game, id }: CardNameProps) => {
  let card = [...game.cards].find(c => c.id === id);
  if(!card)
    return <></>;
  card.card.use()
  let name = card && card.card() ? card.card().name : "?";
  return <span
    onClick={() => card && previewCard(card)}
    onMouseEnter={() => $(".CardName." + id).addClass("highlight")}
    onMouseLeave={() => $(".highlight.CardName." + id).removeClass("highlight")}
    className={"CardName " + id}
  >{name}</span>;
}

export default Log;
