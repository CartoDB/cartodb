var CoreView = require('backbone/core-view');
var template = require('./info.tpl');
var moment = require('moment');

module.exports = CoreView.extend({
  className: 'Share-info',

  initialize: function (opts) {
    if (!opts.userModel) throw new TypeError('userModel is required');
    this._lastUpdate = opts.userModel.get('last_visualization_created_at');
    this._info = _t('components.modals.share.last-version', {
      date: moment(this._lastUpdate).format('Do MMMM YYYY, hh:mm') + 'h'
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      updatedOn: this._info
    }));
    return this;
  }

});
