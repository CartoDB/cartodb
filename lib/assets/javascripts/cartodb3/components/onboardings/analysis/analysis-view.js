var LocalStorage = require('../../../components/local-storage/local-storage');
var CoreView = require('backbone/core-view');
var template = require('./analysis-view.tpl');

var STORAGE_KEY = 'onboarding';
var ANALYSES_TYPES = require('./analyses-types');

module.exports = CoreView.extend({
  className: 'AnalysisCompletionDetails is-opening',

  events: {
    'click .js-forget': '_onClickForget',
    'click .js-close': '_close',
    'click .js-style': '_onStyle'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._modalModel = opts.modalModel;
    this._userModel = opts.userModel;

    LocalStorage.init(STORAGE_KEY, {
      userModel: this._userModel
    });

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      style: this._getStyleAnalysisAfterFinish(),
      type: this._getGenericAnalysisType()
    }));

    var html = this._typeDef().template(this.model.attributes);
    this.$('.js-content').html(html);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._close);
  },

  _close: function () {
    this._checkForgetStatus();
    this.trigger('close', this);
  },

  _onStyle: function () {
    this._checkForgetStatus();
    this.trigger('customEvent', 'style', this);
  },

  _checkForgetStatus: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
  },

  _forget: function () {
    LocalStorage.set(this._getGenericAnalysisType(), true);
  },

  _typeDef: function (type) {
    type = type || this.model.get('type');
    return ANALYSES_TYPES[type];
  },

  _getStyleAnalysisAfterFinish: function () {
    return this._typeDef().style;
  },

  _getGenericAnalysisType: function () {
    return this._typeDef().genericType || this.model.get('type');
  }
});
