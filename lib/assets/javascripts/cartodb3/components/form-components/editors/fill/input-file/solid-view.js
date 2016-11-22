var CoreView = require('backbone/core-view');
var template = require('./solid-view.tpl');
var AssetsView = require('./assets-view');

module.exports = CoreView.extend({
  events: {
    'click .js-upload': '_onClickUpload',
    'click .js-show-collection': '_onClickShowCollection'
  },

  initialize: function (opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.modals) throw new Error('modals is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
    this._modals = opts.modals;
  },

  render: function () {
    this.$el.append(template);
    return this;
  },

  _onClickUpload: function (e) {
    this.killEvent(e);
  },

  _onClickShowCollection: function (e) {
    this.killEvent(e);

    var self = this;

    this._modals.create(function (modalModel) {
      return new AssetsView({
        modalModel: modalModel,
        configModel: self._configModel,
        userModel: self._userModel
      });
    });
  }
});
