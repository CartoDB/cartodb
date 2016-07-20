var LocalStorage = require('../../../components/local-storage/local-storage');
var CoreView = require('backbone/core-view');

var ANALYSES_TYPES = require('./analyses-types');

var TYPE_TO_META_MAP = {};
ANALYSES_TYPES.map(function (d) {
  TYPE_TO_META_MAP[d.type] = d;
});

module.exports = CoreView.extend({

  events: {
    'click .js-forget': '_onClickForget',
    'click .js-close': '_onClose',
    'click .js-style': '_onStyle'
  },

  className: 'Onboarding AnalysisCompletionDetails is-opening',

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._modalModel = opts.modalModel;
    this._userModel = opts.userModel;

    LocalStorage.init('onboarding', {
      userModel: this._userModel
    });
  },

  render: function () {
    var html = this._typeDef().template(this.model.attributes);

    this.$el.html(html);

    return this;
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
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
    this.trigger('close', this);
  },

  _typeDef: function (type) {
    type = type || this.model.get('type');
    return TYPE_TO_META_MAP[type];
  }
});
