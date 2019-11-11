/* @flow */

import React from "react";
import Game from "./Game";
import type { Player } from "./Game";
import NumberBadge from "./NumberBadge";
import rightClick from "./rightClick";
import type { Observable } from "rhobo";
import { observer } from "rhobo";

type Props = {
    player: Player,
    game: Game,
    active?: Observable<number>,
}
const GoldBadge = observer<Props>(({ player }) =>
  <div
    className="gold Badge"
    data-g={+!!player.gold()}
    data-f={typeof player.gold.val === "boolean" ? "" : player.gold.val[0].toUpperCase()}
    onClick={() => player.gold.toggle()}
    {...rightClick([
      { name: "Any", func: () => player.gold(true) },
      ...Game.alignments.map(a => ({
        name: Game.alignmentNames[a],
        func: () => player.gold(a),
        class: a,
      }))
    ])}
  />
);
const User = ({ player, game, active: _active }: Props) => {
  let user = player.user;
  let active = _active ? !!_active.use()() : true;
  return (
    <div className={(active ? "" : "inactive") + " user " + (player === game.p ? "p" : "o")}>
      <div className="avatarGroup">
        <GoldBadge player={player} game={game}/>
        <img className="avatar" src={`/api/user:${user._id}/avatar`} {...rightClick(
          player === game.p ?
            [ { name: "Concede", func: () => game.ws.s("concede") } ] :
            []
        )}/>
        <NumberBadge value={player.health} className="health"/>
      </div>
      <span className="username">{`@${user.username}#${user.discriminator}`}</span>
    </div>
  )
}

export default User;
