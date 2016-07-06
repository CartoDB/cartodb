var CoreView = require('backbone/core-view');
var template = require('./info.tpl');
var moment = require('moment');

module.exports = CoreView.extend({
  className: 'Share-info',

  initialize: function (opts) {
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');
    this._visDefinitionModel = opts.visDefinitionModel;
    this._mapcapsCollection = opts.mapcapsCollection;
    this._isLoading = opts.loading || false;
    this._mapcapsCollection.on('reset', this.render, this);
    this.add_related_model(this._mapcapsCollection);
  },

  render: function () {
    var published = this._mapcapsCollection.length > 0
                    ? _t('components.modals.share.last-published', { date: moment(this._mapcapsCollection.first().get('created_at')).format('Do MMMM YYYY, HH:mm') })
                    : '';

    this.clearSubViews();
    this.$el.html(template({
      isPublished: this._mapcapsCollection.length > 0,
      updatedOn: published,
      loading: this._isLoading
    }));
    return this;
  }

});
