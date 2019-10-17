/* @flow */

import React from "react";
import { observable } from "./hobo";
import type { Observable } from "./hobo";
import $ from "jquery";

type MenuItem = {
    id?: number,
    func: any=>any,
    name: string,
    class?: string,
    show?: Observable<boolean>,
}

const menu = observable<Array<MenuItem>>([]);
const offset = observable<{ left: number, top: number }>({ left: 0, top: 0 });

const RightClickMenuItem = ({ item }) => {
  let show = !item.show || item.show.use()();
  return show ? <span className={item.class} onClick={item.func}>{item.name}</span> : null;
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
    setTimeout(() => {
      menu(menuItems)
      $(el).addClass("rightClicked").parents().addClass("childRightClicked");
    });
    let left = e.clientX;
    let top = e.clientY;
    offset({
      left,
      top: Math.min(top, vh - height),
    })
    e.persist();
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
