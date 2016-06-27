var CoreView = require('backbone/core-view');
var template = require('./info.tpl');
var moment = require('moment');

module.exports = CoreView.extend({
  className: 'Share-info',

  initialize: function (opts) {
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');
    this._lastUpdate = opts.visDefinitionModel.get('updated_at');
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
