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
    dataviewAttrsNames: []
  },

  initialize: function (attrs, opts) {
    this.dataviewModel = opts.dataviewModel;
  },

  /**
   * @public
   * @param {Object} changes, not that it should be
   * @throws {Error} Should throw an error if the attrs are invalid or inconsistent
   */
  update: function (changes) {
    var attrs = _.pick(changes, this.get('attrsNames'));
    this.set(attrs);
    attrs = _.pick(changes, this.dataviewModel.constructor.ATTRS_NAMES);
    this.dataviewModel.set(attrs);
    return !!(this.changedAttributes() || this.dataviewModel.changedAttributes());
  },

  /**
   * @public
   */
  remove: function () {
    this.dataviewModel.remove();
    this.trigger('destroy', this);
    this.stopListening();
  }
});
