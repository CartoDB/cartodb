var LocalStorage = require('../../../components/local-storage/local-storage');
var CoreView = require('backbone/core-view');

var ANALYSES_TYPES = require('./analyses-types');

var TYPE_TO_META_MAP = {};
ANALYSES_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

module.exports = CoreView.extend({

  className: 'AnalysisCompletionDetails is-opening',

  events: {
    'click .js-forget': '_onClickForget',
    'click .js-close': '_onClose',
    'click .js-style': '_onStyle'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._modalModel = opts.modalModel;
    this._userModel = opts.userModel;

    LocalStorage.init('onboarding', {
      userModel: this._userModel
    });

    this._initBinds();
  },

  render: function () {
    var html = this._typeDef().template(this.model.attributes);

    this.$el.html(html);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._onDestroy);
  },

  _close: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
    this.trigger('close', this);
  },

  _onDestroy: function () {
    this._close();
  },

  _forget: function () {
    LocalStorage.set(this.model.get('type'), true);
  },

  _onStyle: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
    this.trigger('style', this);
  },

  _onClose: function () {
    this._close();
  },

  _typeDef: function (type) {
    type = type || this.model.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
