/* @flow */

import React from "react";
import { observable } from "rhobo";
import type { Observable } from "rhobo";
import $ from "jquery";

type MenuItem = {
    id?: number,
    func: any=>any,
    name: string | Observable<string>,
    class?: string,
    show?: Observable<boolean>,
}

const menu = observable<Array<MenuItem>>([]);
const offset = observable<{ left: number, top: number }>({ left: 0, top: 0 });

const RightClickMenuItem = ({ item }) => {
  let show = !item.show || item.show.use()();
  let name = typeof item.name === "string" ? item.name : item.name()
  return show ? <span className={item.class} onClick={item.func}>{name}</span> : null;
}

const RightClickMenu = () => {
  menu.use();
  let { left, top } = offset.use()();
  return <div className="RightClickMenu" style={{ left, top }}>
    {menu().map(item => <RightClickMenuItem key={item.id = item.id ?? Math.random()} item={item}/>)}
  </div>
}

const rightClick = (menuItems: Array<MenuItem>) => ({
  onContextMenu: (e: SyntheticMouseEvent<>)  => {
    const el = e.currentTarget;
    let height = 30 * menuItems.length + 1;
    let vh = $("body").height();
    menu(menuItems)
    $(el).addClass("rightClicked").parents().addClass("childRightClicked");
    let left = e.clientX;
    let top = e.clientY;
    offset({
      left,
      top: Math.min(top, vh - height),
    })
    e.preventDefault();
    e.stopPropagation();
  },
});

const f = () => {
  $(".rightClicked, .childRightClicked").removeClass("rightClicked childRightClicked");
  menu([]);
};

const appEventBindings = {
  onClick: f,
  onContextMenu: (e: SyntheticEvent<>) => {
    e.preventDefault();
    f();
  }
};


export default rightClick;
export { RightClickMenu, appEventBindings };
export type { MenuItem };
