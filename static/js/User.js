/* @flow */

import React from "react";
import Game from "./Game";
import type { Player } from "./Game";
import NumberBadge from "./NumberBadge";
import rightClick from "./rightClick";
import { observer } from "rhobo";

type Props = {
    player: Player,
    game: Game,
}
const GoldBadge = observer<{ player: Player, lock: boolean }>(({ player, lock }) =>
  <div
    className={"gold Badge " + (lock ? "lock" : "")}
    data-g={+!!player.gold()}
    data-f={typeof player.gold.val === "boolean" ? "" : player.gold.val[0].toUpperCase()}
    onClick={() => !lock && player.gold.toggle()}
    {...rightClick(lock ? [] : [
      { name: "Any", func: () => player.gold(true) },
      ...Game.alignments.map(a => ({
        name: Game.alignmentNames[a],
        func: () => player.gold(a),
        class: a,
      }))
    ])}
  />
);
const User = ({ player, game }: Props) => {
  let { spectating } = game;
  let user = player.user;
  let active = player.active.use()();
  return (
    <div className={(active ? "" : "inactive") + " user " + (player === game.p ? "p" : "o")}>
      <div className="avatarGroup">
        <GoldBadge lock={spectating} player={player}/>
        <img className="avatar" src={`/api/user:${user._id}/avatar`} {...rightClick(
          player === game.p ?
            spectating ?
              [{ name: "Swap Sides", func: () => game.swapSides() }] :
              [ { name: "Concede", func: () => game.ws.s("concede") } ] :
            []
        )}/>
        <NumberBadge lock={spectating} value={player.health} className="health"/>
      </div>
      <span className="username">{`@${user.username}#${user.discriminator}`}</span>
    </div>
  )
}

export default User;
