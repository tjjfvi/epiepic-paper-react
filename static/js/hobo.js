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

  deps: Array<Observable<any>>;

  update: () => any;

  addDep(o: Observable<any>){
    this.deps.push(o);
    o.ee.on("change", this.update);
  }

}

const observable = <T/**/>(val: T): Observable<T> => {
  const f = v => {
    if(v !== undefined) {
      let old = o.val;
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

const computed = <T/**/>(func: () => T) => {
  // $FlowFixMe
  const o: Computed<T> = Object.setPrototypeOf(observable(), _Computed.prototype);
  o.deps = [];
  o.update = () => {
    o.deps.map(O => O.ee.removeListener("change", o.update));
    o.deps = [];
    cur = o;
    o(func());
  }
  o.update();
  return o;
}

const useValue = <V/**/>(v: () => V): V => React.useState(v)[0];
const useObservable = <T/**/>(v: T): Observable<T> => useValue(() => observable(v));
const useComputed = <T/**/>(v: () => T): Computed<T> => useValue(() => computed(v));

export { observable, computed, useValue, useObservable, useComputed };
export type { Observable, Computed };
