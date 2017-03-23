var cdb = require('cartodb.js-v3');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../cartodb3/helpers/required-opts');

var MAXSTRLEN = 140;

var REQUIRED_OPTS = [
  '$form'
];

module.exports = CoreView.extend({

  className: 'FormAccount-rowData',

  events: {
    'click .js-button': '_onUpdate'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

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
      isDisabled: this._isDisabled() || this._isNegative(),
      isNegative: this._isNegative(),
      counter: MAXSTRLEN - this.model.get('counter')
    }));

    return this;
  },

  updateCounter: function (strLen) {
    this.model.set('counter', strLen);
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change', this.render);
  },

  _isNegative: function () {
    return this.model.get('counter') >= MAXSTRLEN;
  },

  _isDisabled: function () {
    return this.model.get('counter') === 0;
  },

  _isLoading: function () {
    return this.model.get('status') === 'loading';
  },

  _onUpdate: function () {
    if (this._isDisabled()) return false;

    this.model.set({ status: 'loading' });

    this._$form.submit();
  }
});
