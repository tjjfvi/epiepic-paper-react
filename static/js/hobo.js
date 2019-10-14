/* @flow */

import React from "react";
import EventEmmiter from "events";

let cur: ?Observable<any>;

type Observable<T> = ((val?: T) => T) & _Observable<T>
type Computed<T> = ((val?: T) => T) & _Computed<T>

class _Observable<T> extends Function {

    o: Observable<T>;
    val: T;
    ee: EventEmmiter;

    addDep(o: Observable<T>){
      return o;
    }

    use(){
      let [, setState] = React.useState({});
      this.ee.once("change", () => setState({}));
      return this;
    }

    toggle(): boolean{
      if(typeof this.o() !== "boolean")
        throw new Error("Not a boolean");
      // $FlowFixMe
      return this.o(!this.o());
    }

    inc(amount: number = 1): number{
      if(typeof this.o() !== "number")
        throw new Error("Not a number");
      // $FlowFixMe
      return this.o(this.o() + amount);
    }

    dec(amount: number = 1): number{
      return this.inc(-amount);
    }

}

class _Computed<T> extends _Observable<T> {

  deps: Set<Observable<any>>;

  update: () => any;

  addDep(o: Observable<any>){
    if(this.deps.has(o))
      return;
    o.ee.on("change", this.update);
    this.deps.add(o);
  }

}

const observable = <T/**/>(val: T): Observable<T> => {
  const f = v => {
    if(v !== undefined) {
      let old = o.val;
      if(old === v)
        return v;
      o.val = v;
      o.ee.emit("change", v, old);
      return v;
    } else {
      if(cur) cur.addDep(o);
      return o.val;
    }
  };
  // $FlowFixMe
  const o: Observable<T> = Object.setPrototypeOf(f, _Observable.prototype);
  o.o = o;
  o.val = val;
  o.ee = new EventEmmiter();
  return o;
}

const computed = <T/**/>(func: () => T, writeFunc?: T => any) => {
  const o = observable();
  // $FlowFixMe
  const c: Computed<T> = Object.setPrototypeOf(val => {
    if(val !== undefined) {
      if(!writeFunc)
        throw new Error("Not a writeable computed");
      if(val === o.val)
        return val;
      writeFunc(val);
      return val;
    } else {
      return o();
    }
  }, _Computed.prototype);
  c.o = c;
  c.ee = o.ee;
  Object.defineProperty(c, "val", {
    get(){
      return o.val;
    },
    set(x){
      o.val = x;
    },
  })
  c.deps = new Set();
  c.update = () => {
    c.deps.forEach(O => O.ee.removeListener("change", c.update));
    c.deps = new Set();
    cur = c;
    let v = func();
    cur = null;
    o(v);
  }
  c.update();
  return c;
}

const useValue = <V/**/>(v: () => V): V => React.useState(v)[0];
const useObservable = <T/**/>(v: T): Observable<T> => useValue(() => observable(v));
const useComputed = <T/**/>(v: () => T): Computed<T> => useValue(() => computed(v));

export { observable, computed, useValue, useObservable, useComputed };
export type { Observable, Computed };
