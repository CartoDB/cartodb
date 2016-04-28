var _ = require('underscore');
var cdb = require('cartodb.js');

/**
 * Default widget model
 *
 * Note: Currently all widgets have a dependency on a dataview, why it makes sense to have it here.
 * If you need a widget model that's backed up by a dataview model please implement your own model and adhere to the
 * public interface instead of extending/hacking this one.
 */
module.exports = cdb.core.Model.extend({
  defaults: {
    attrsNames: [],
    show_stats: false
  },

  defaultState: {
    'collapsed': false,
    'pinned': false
  },

  initialize: function (attrs, opts) {
    this.dataviewModel = opts.dataviewModel;
  },

  /**
   * @public
   * @param {Object} attrs, not that it should be
   * @return {Boolean} true if at least one attribute was changed
   * @throws {Error} Should throw an error if the attrs are invalid or inconsistent
   */
  update: function (attrs) {
    var wAttrs = _.pick(attrs, this.get('attrsNames'));
    this.set(wAttrs);
    this.dataviewModel.update(attrs);
    return !!(this.changedAttributes() || this.dataviewModel.changedAttributes());
  },

  /**
   * @public
   */
  remove: function () {
    this.dataviewModel.remove();
    this.trigger('destroy', this);
    this.stopListening();
  },

  setState: function (state) {
    this.set(state);
  },

  getState: function () {
    var fullState = _.defaults({
      'collapsed': this.get('collapsed'),
      'pinned': this.get('pinned')
    }, this.defaultState);
    var state = {};
    for (var key in fullState) {
      if (this.defaultState[key] !== fullState[key]) {
        state[key] = fullState[key];
      }
    }
    return state;
  }
});
