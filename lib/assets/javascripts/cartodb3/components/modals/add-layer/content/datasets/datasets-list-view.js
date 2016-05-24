var cdb = require('cartodb.js');
var DATASETS_ITEMS = {
  'datasets': require('./dataset-item-view'),
  'remotes': require('./remote-dataset-item-view')
};

/**
 * View representing the list of datasets
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',
  className: 'DatasetsList',

  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._tablesCollection = this._createModel.getTablesCollection();

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._tablesCollection.each(this._addItem, this);
    return this;
  },

  _initBinds: function () {
    this._tablesCollection.bind('sync', this.render, this);
    this.add_related_model(this._tablesCollection);
  },

  _addItem: function (m, i) {
    var type = m.get('type') === 'remote' ? 'remotes' : 'datasets';

    var item = new DATASETS_ITEMS[type]({
      model: m,
      createModel: this._createModel,
      userModel: this._userModel
    });

    this.addView(item);
    this.$el.append(item.render().el);
  },

  show: function () {
    this.$el.removeClass('is-hidden');
  },

  hide: function () {
    this.$el.addClass('is-hidden');
  }

});
