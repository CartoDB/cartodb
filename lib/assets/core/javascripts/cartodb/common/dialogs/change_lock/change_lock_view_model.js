var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var batchProcessItems = require('../../batch_process_items');

/**
 * View model for change lock view.
 * Manages the life cycle states for the change lock view.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    state: 'ConfirmChangeLock',
    initialLockValue: false,
    contentType: 'datasets',
    items: undefined // a Backbone collection
  },

  initialize: function(attrs) {
    this.elder('initialize');
    this.set('items', new Backbone.Collection(attrs.items));
    if (this.get('items').chain().map(function(item) { return item.get('locked'); }).uniq().value().length > 1) {
      var errorMsg = 'It is assumed that all items have the same locked state, a user should never be able to ' +
        'select a mixed item with current UI. If you get an error with this message something is broken';
      if (window.trackJs && window.trackJs.track) {
        window.trackJs.track(errorMsg);
      } else {
        throw new Error(errorMsg);
      }
    }

    this.set('initialLockValue', this.get('items').at(0).get('locked'));
  },

  inverseLock: function() {
    this.set('state', 'ProcessingItems');

    batchProcessItems({
      howManyInParallel: 5,
      items: this.get('items').toArray(),
      processItem: this._lockItem.bind(this, !this.get('initialLockValue')),
      done: this.set.bind(this, 'state', 'ProcessItemsDone'),
      fail: this.set.bind(this, 'state', 'ProcessItemsFail')
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
