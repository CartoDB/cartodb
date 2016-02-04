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
    title: '',
    collapsed: false,
    dataviewModelAttrsNames: []
  },

  initialize: function (attrs, opts) {
    this.dataviewModel = opts.dataviewModel;
  },

  /**
   * @public
   */
  isCollapsed: function () {
    return this.get('collapsed');
  },

  /**
   * @public
   */
  toggleCollapsed: function () {
    this.set('collapsed', !this.get('collapsed'));
  },

  /**
   * @public
   * @param {Object} changes, not that it should be
   * @throws {Error} Should throw an error if the attrs are invalid or inconsistent
   */
  update: function (changes) {
    var attrs = _.pick(changes, this._attrsNames());
    this.set(attrs);
    attrs = _.pick(changes, this.get('dataviewModelAttrsNames'));
    this.dataviewModel.set(attrs);
    return !!(this.changedAttributes() || this.dataviewModel.changedAttributes());
  },

  /**
   * @return {Array<String>} names of attrs on dataviewModel
   */
  _attrsNames: function () {
    return ['title', 'collapsed'];
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
