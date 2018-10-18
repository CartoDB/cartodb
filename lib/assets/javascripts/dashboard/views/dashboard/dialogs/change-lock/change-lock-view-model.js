const Backbone = require('backbone');
const batchProcessItems = require('dashboard/helpers/batch-process-items');

/**
 * View model for change lock view.
 * Manages the life cycle states for the change lock view.
 */
module.exports = Backbone.Model.extend({
  defaults: {
    state: 'ConfirmChangeLock',
    initialLockValue: false,
    contentType: 'datasets',
    items: undefined // a Backbone collection
  },

  initialize: function (attributes) {
    this.set('items', new Backbone.Collection(attributes.items));

    const lockedStates = this.get('items').chain()
      .map(item => item.get('locked'))
      .uniq()
      .value()
      .length;

    if (lockedStates > 1) {
      const errorMsg = 'It is assumed that all items have the same locked state, a user should never be able to ' +
        'select a mixed item with current UI. If you get an error with this message something is broken';

      if (window.trackJs && window.trackJs.track) {
        window.trackJs.track(errorMsg);
      } else {
        throw new Error(errorMsg);
      }
    }

    this.set('initialLockValue', this.get('items').at(0).get('locked'));
  },

  inverseLock: function () {
    this.set('state', 'ProcessingItems');

    batchProcessItems({
      howManyInParallel: 5,
      items: this.get('items').toArray(),
      processItem: this._lockItem.bind(this, !this.get('initialLockValue')),
      done: this.set.bind(this, 'state', 'ProcessItemsDone'),
      fail: this.set.bind(this, 'state', 'ProcessItemsFail')
    });
  },

  _lockItem: function (newLockedValue, item, callback) {
    item.save({ locked: newLockedValue })
      .done(function () {
        callback();
      })
      .fail(() =>
        callback('something failed') // eslint-disable-line
      );
  }
});
