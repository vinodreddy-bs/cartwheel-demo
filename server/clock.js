function createClock() {
  let fixed = null;
  return {
    now: () => (fixed ? new Date(fixed.getTime()) : new Date()),
    set: (date) => { fixed = new Date(date.getTime()); },
    clear: () => { fixed = null; },
    isFixed: () => fixed !== null,
  };
}

module.exports = { createClock };
