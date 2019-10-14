/* @flow */

import React from "react";
import EventEmitter from "events";
import { observable, computed } from "./hobo";
import type { Observable } from "./hobo";
import LoginScreen from "./LoginScreen";
// import { go } from "./App";

class WS extends EventEmitter {

  ws: WebSocket;
  url: string;

  constructor(url: string){
    super();
    this.url = url;
    this.setupWs();
  }

  close(){
    go(() => <div className="disconnected">Disconnected; refresh to reconnect</div>);
  }

  setupWs(){
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onmessage = ({ data: msg }: { data: any }) => {
      const data = JSON.parse(msg);
      if(data[0] === "ping") return;
      console.log("<", ...data);
      this.emit("message", data);
      if(data[0] === "login")
        go(LoginScreen);
    };
    ws.onerror = ws.onclose = () => {
      this.close();
    };
  }

  s(...data: Array<any>){
    console.log(">", ...data);
    this.ws.send(JSON.stringify(data));
  }

  observable<T>(val: T, recvType: Array<any>, sendType: Array<any> = recvType): Observable<T>{
    let o = observable<T>(val);
    let c = computed<T>(
      () => o(),
      v => {
        o(v);
        this.s(...sendType, v)
      }
    );
    this.on("message", data => {
      if(!recvType.every((x, i) => data[i] === x)) return;
      o(data[recvType.length]);
    });
    return c;
  }

}

const location = window.location;
const { protocol, pathname, host } = location;
const wsPath = pathname.replace(/\/$/, "") + "/ws";
const wsProtocol = protocol === "https:" ? "wss" : "ws";
export default new WS(`${wsProtocol}://${host}${wsPath}`);
export { WS }

import { go } from "./App";
