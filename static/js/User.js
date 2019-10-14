/* @flow */

import React from "react";
import Game from "./Game";
import type { Player } from "./Game";

type Props = {
    player: Player,
    game: Game,
}
const User = ({ player, game }: Props) => {
  let user = player.user;
  return (
    <div className={"user " + (player === game.p ? "p" : "o")}>
      <div className="avatarGroup">
        <img className="avatar" src={`/api/user:${user._id}/avatar`}/>
      </div>
      <span className="username">{`@${user.username}#${user.discriminator}`}</span>
    </div>
  )
}

export default User;
