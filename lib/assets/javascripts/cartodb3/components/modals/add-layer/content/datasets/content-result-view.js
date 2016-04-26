var cdb = require('cartodb.js');
var randomQuote = require('../../../../loading/random-quote');

/*
 *  Content result default view
 */

module.exports = cdb.core.View.extend({
  events: {
    'click .js-connect': '_onConnectClick'
  },

  initialize: function (opts) {
    if (!opts.routerModel) throw new Error('routerModel is required');
    if (!opts.tablesCollection) throw new Error('tablesCollection is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.template) throw new Error('template is required');

    this._userModel = opts.userModel;
    this._routerModel = opts.routerModel;
    this._tablesCollection = opts.tablesCollection;
    this.template = opts.template;

    this._initBinds();
  },

  render: function () {
    var type = this._routerModel.get('content_type');

    this.$el.html(this.template({
      page: this._routerModel.get('page'),
      tag: this._routerModel.get('tag'),
      q: this._routerModel.get('q'),
      shared: this._routerModel.get('shared'),
      locked: this._routerModel.get('locked'),
      library: this._routerModel.get('library'),
      quote: randomQuote(),
      type: type,
      totalItems: this._tablesCollection.size(),
      totalEntries: this._tablesCollection.getTotalStat('total_entries')
    }));

    return this;
  },

  _initBinds: function () {
    this._routerModel.bind('change', this.render, this);
    this._tablesCollection.bind('sync', this.render, this);
    this.add_related_model(this._routerModel);
    this.add_related_model(this._tablesCollection);
  },

  _onConnectClick: function () {
    this.trigger('connectDataset', this);
  }

});
