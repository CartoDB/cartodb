const _ = require('underscore');
const Backbone = require('backbone');

/**
 * Default model for a privacy option.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    privacy: 'PUBLIC',
    disabled: false,
    selected: false,
    password: undefined
  },

  validate: function (attrs) {
    if (attrs.disabled && attrs.selected) {
      return 'Option can not be disabled and selected at the same time';
    }
  },

  classNames: function () {
    return _.chain(['disabled', 'selected'])
      .map(attr => this.attributes[attr] ? 'is-' + attr : undefined)
      .compact().value().join(' ');
  },

  canSave: function () {
    return !this.get('disabled');
  },

  /**
   * @param vis {Object} instance of cdb.admin.Visualization
   * @param callbacks {Object}
   */
  saveToVis: function (vis, callbacks) {
    return vis.save(this._attrsToSave(), _.extend({ wait: true }, callbacks));
  },

  /**
   * @returns {Object} attrs
   * @protected
   */
  _attrsToSave: function () {
    return _.pick(this.attributes, 'privacy', 'password');
  }
});
