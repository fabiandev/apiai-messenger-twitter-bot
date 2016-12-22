'use strict';

class Storage {

  constructor() {
    this._storage = new Map();
  }

  get(name) {
    if (!this._storage.has(name)) {
      this._storage.set(name, new Map());
    }

    return this._storage.get(name);
  }

}

module.exports = (new Storage());
