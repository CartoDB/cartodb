var CoreView = require('backbone/core-view');
var template = require('./header.tpl');
var moment = require('moment');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new TypeError('userModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');

    this._privacy = opts.visDefinitionModel.get('privacy');
    this._name = opts.visDefinitionModel.get('name');
    this._lastUpdate = opts.visDefinitionModel.get('updated_at');
    this._avatar = opts.userModel.get('avatar_url');
    this._info = _t('components.modals.share.published', {
      when: moment(this._lastUpdate).fromNow()
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      privacy: this._privacy,
      name: this._name,
      published: this._info,
      avatar: this._avatar
    }));
    return this;
  }

});
