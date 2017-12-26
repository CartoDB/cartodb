var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');

var MAXSTRLEN = 140;

module.exports = cdb.core.View.extend({

  className: 'FormAccount-rowData',

  events: {
    'click .js-button': 'onUpdate'
  },

  initialize: function (opts) {
    this.template = cdb.templates.getTemplate('organization/organization_notification/send_button');

    this.model = new Backbone.Model({
      status: 'idle',
      counter: 0
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(this.template({
      isLoading: this._isLoading(),
      isDisabled: this._isDisabled(),
      isNegative: this._isNegative(),
      counter: MAXSTRLEN - this.model.get('counter')
    }));

    return this;
  },

  updateCounter: function (strLen) {
    this.model.set('counter', strLen);
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _isNegative: function () {
    return this.model.get('counter') > MAXSTRLEN;
  },

  _isDisabled: function () {
    return (this.model.get('counter') === 0) || this._isNegative() || this._isLoading();
  },

  _isLoading: function () {
    return this.model.get('status') === 'loading';
  },

  _submit: function () {
    this.trigger('submitForm');
  },

  onUpdate: function () {
    if (this._isDisabled()) return false;

    this._submit();

    this.model.set({ status: 'loading' });
  }
});
