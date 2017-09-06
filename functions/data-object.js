/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const $db = Symbol('db');
const $id = Symbol('id');

class DataObject {
  static get properNoun() {
    return this.constructor.name;
  }

  static get collectionPath() {
    return `/${this.properNoun.replace(/\s/g, '_').toLowerCase()}s`;
  }

  static async create(db, initialValues) {
    console.log(`Creating new ${this.properNoun}...`);

    const DataObjectClass = this;
    const snapshot = await db.ref(this.collectionPath).push(initialValues);
    const id = snapshot.key;

    console.log(`New ${this.properNoun} created with ID ${id}.`);

    return new DataObjectClass(db, id);
  }

  get db() {
    return this[$db];
  }

  get id() {
    return this[$id];
  }

  get ref() {
    return this.db.ref(`${this.constructor.collectionPath}/${this.id}`);
  }

  get formalName() {
    return `${this.constructor.properNoun} ${this.id}`;
  }

  constructor(db, id) {
    this[$db] = db;
    this[$id] = id;

    if (this.id == null) {
      throw new Error(`Missing ID when looking up ${this.properNoun}.`);
    }
  }

  async read() {
    const snapshot = await this.ref.once('value');

    if (!snapshot.exists()) {
      throw new Error(`${this.formalName} does not exist!`);
    }

    return snapshot.val();
  }
}

module.exports = DataObject;
