/*jshint eqeqeq:false */
// Ask user for token using browser prompt
let TOKEN = prompt("Enter your token");

(function (window) {
  "use strict";

  function Store(name, callback) {
    callback = callback || function () {};

    // Ensure a table exists with this name
    let self = this;
    self._dbName = `todo2_${name}`;
    fetch("https://latest.datasette.io/ephemeral/-/create", {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        table: self._dbName,
        columns: [
          { name: "id", type: "integer" },
          { name: "title", type: "text" },
          { name: "completed", type: "integer" },
        ],
        pk: "id",
      }),
    }).then(function (r) {
      callback.call(this, []);
    });
  }

  /**
   * Finds items based on a query given as a JS object
   *
   * @param {object} query The query to match against (i.e. {foo: 'bar'})
   * @param {function} callback	 The callback to fire when the query has
   * completed running
   */
  Store.prototype.find = function (query, callback) {
    // This is used for the active/completed tabs
    // query is {completed: true} or {completed: false}
    if (!callback) {
      return;
    }
    fetch(
      `https://latest.datasette.io/ephemeral/${
        this._dbName
      }.json?_shape=array&_sort_desc=id&completed=${
        (query.completed && "1") || "0"
      }`,
      {
        mode: "cors",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((r) => r.json())
      .then((data) => {
        callback.call(self, data);
      });
  };

  /**
   * Will retrieve all data from the collection
   *
   * @param {function} callback The callback to fire upon retrieving data
   */
  Store.prototype.findAll = function (callback) {
    let self = this;
    callback = callback || function () {};
    fetch(
      `https://latest.datasette.io/ephemeral/${self._dbName}.json?_shape=array&_sort_desc=id`,
      {
        mode: "cors",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((r) => r.json())
      .then((data) => {
        callback.call(self, data);
      });
  };

  /**
   * Will save the given data to the DB. If no item exists it will create a new
   * item, otherwise it'll simply update an existing item's properties
   *
   * @param {object} updateData The data to save back into the DB
   * @param {function} callback The callback to fire after saving
   * @param {number} id An optional param to enter an ID of an item to update
   */
  Store.prototype.save = function (updateData, callback, id) {
    // {title, completed}
    callback = callback || function () {};
    let self = this;

    // If an ID was actually given, find the item and update each property
    if (id) {
      fetch(
        `https://latest.datasette.io/ephemeral/${self._dbName}/${id}/-/update`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ update: updateData }),
        }
      )
        .then((r) => r.json())
        .then((data) => {
          callback.call(self, data);
        });
    } else {
      // Save it and store ID
      fetch(`https://latest.datasette.io/ephemeral/${self._dbName}/-/insert`, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row: updateData,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          let row = data.rows[0];
          callback.call(self, row);
        });
    }
  };

  /**
   * Will remove an item from the Store based on its ID
   *
   * @param {number} id The ID of the item you want to remove
   * @param {function} callback The callback to fire after saving
   */
  Store.prototype.remove = function (id, callback) {
    fetch(
      `https://latest.datasette.io/ephemeral/${this._dbName}/${id}/-/delete`,
      {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((r) => r.json())
      .then((data) => {
        callback.call(self, []);
      });
  };

  /**
   * Will drop all storage and start fresh
   *
   * @param {function} callback The callback to fire after dropping the data
   */
  Store.prototype.drop = function (callback) {
    alert("todo: drop feature");
  };

  // Export to window
  window.app = window.app || {};
  window.app.Store = Store;
})(window);
