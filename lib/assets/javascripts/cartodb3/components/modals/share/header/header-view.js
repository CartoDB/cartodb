var CoreView = require('backbone/core-view');
var template = require('./header.tpl');
var moment = require('moment');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new TypeError('userModel is required');
    this._lastUpdate = opts.userModel.get('last_visualization_created_at');
    this._avatar = 'https://s3.amazonaws.com/com.cartodb.users-assets.production/production/butilon/assets/201605180747041349978691.jpg'; // opts.userModel.get('avatar_url');
    this._info = _t('components.modals.share.published', {
      when: moment(this._lastUpdate).fromNow()
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      published: this._info,
      avatar: this._avatar
    }));
    return this;
  }

});
