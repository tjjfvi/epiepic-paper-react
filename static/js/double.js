/* @flow */

let clickTarget, clickTimeout;

const double = (a: (any=>any), b: (any=>any) = a): (any => any) => {
  let f = e => {
    clearTimeout(clickTimeout);
    if(clickTimeout && clickTarget === f) {
      clickTarget = null;
      return a(e);
    }
    clickTarget = f;
    clickTimeout = setTimeout(() => {
      clickTimeout = null;
      b(e);
    }, 250);
    e.persist();
  }
  return f;
};

export default double;
