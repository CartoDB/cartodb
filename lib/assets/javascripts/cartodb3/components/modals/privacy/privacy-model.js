var Backbone = require('backbone');
var _ = require('underscore');

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
      .map(function (attr) { return this.attributes[attr] !== undefined ? 'is-' + attr : undefined; }, this)
      .compact().value().join(' ');
  },

  canSave: function () {
    return !this.get('disabled');
  },

  isPassword: function () {
    return false;
  },

  isSelected: function () {
    return this.get('selected') === true;
  },

  saveToVis: function (vis, callbacks) {
    return vis.save(this._attrsToSave(), _.extend({ wait: true }, callbacks));
  },

  _attrsToSave: function () {
    return _.pick(this.attributes, 'privacy', 'password');
  }
});
