var CoreView = require('backbone/core-view');
var template = require('./edit-field.tpl');
var _ = require('underscore');
var Backbone = require('backbone');

/**
 *  Common edit field view
 *
 */

module.exports = CoreView.extend({

  className: 'EditField',

  options: {
    template: template
  },

  initialize: function () {
    if (!this.model) {
      this.model = new Backbone.Model({ value: '' });
    }
    if (this.options.template) {
      this.template = this.options.template;
    }
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      this.template(
        _.extend(
          this.options,
          {
            type: this.model.get('type'),
            value: this.model.get('value'),
            attribute: this.model.get('attribute'),
            readOnly: this.model.get('readOnly')
          }
        )
      )
    );

    if (this.model.get('readOnly')) {
      this.undelegateEvents();
    }

    return this;
  },

  _initBinds: function () {
    this.model.bind('error valid', this._setFieldStyle, this);
    this.model.bind('change:readOnly', this.render, this);
  },

  _setFieldStyle: function () {
    this.$el[this.model.getError() ? 'addClass' : 'removeClass']('is-invalid');
  },

  _hasSubmit: function (e) {
    if (!e) {
      throw new Error('event needed to check if user has submitted from the input');
    }

    var ua = navigator.userAgent.toLowerCase();
    var isMac = /mac os/.test(ua);

    return ((isMac && e.metaKey) || (!isMac && e.ctrlKey)) && e.keyCode === 13;
  },

  isValid: function () {
    return this.model.isValid();
  }

});
