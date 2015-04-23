var Backbone = require('backbone');
var batchProcessItems = require('../../new_common/batch_process_items');

/**
 * View model for change lock view.
 * Manages the life cycle states for the change lock view.
 */
module.exports = Backbone.Collection.extend({

  initialize: function(models) {
    if (this.chain().map(function(item) { return item.get('locked'); }).uniq().value().length > 1) {
      var errorMsg = 'It is assumed that all items have the same locked state, a user should never be able to ' +
        'select a mixed item with current UI. If you get an error with this message something is broken';
      if (window.trackJs && window.trackJs.track) {
        window.trackJs.track(errorMsg);
      } else {
        throw new Error(errorMsg);
      }
    }

    this.setState('ConfirmChangeLock');
    this._initialLockValue = models[0].get('locked');
  },

  state: function() {
    return this._state;
  },

  setState: function(newState) {
    this._state = newState;
    this.trigger('change');
    this.trigger(newState);
  },

  initialLockValue: function() {
    return this._initialLockValue;
  },

  inverseLock: function() {
    this.setState('ProcessingItems');

    batchProcessItems({
      howManyInParallel: 5,
      items: this.toArray(),
      processItem: this._lockItem.bind(this, !this.initialLockValue()),
      done: this.setState.bind(this, 'ProcessItemsDone'),
      fail: this.setState.bind(this, 'ProcessItemsFail')
    });
  },

  _lockItem: function(newLockedValue, item, callback) {
    item.save({ locked: newLockedValue })
      .done(function() {
        callback();
      })
      .fail(function() {
        callback('something failed');
      });
  }
});
