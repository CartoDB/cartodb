var CoreView = require('backbone/core-view');
var TableHeadItemView = require('./table-head-item-view');
var template = require('./table-head.tpl');

/*
 *  Main table head view
 */

module.exports = CoreView.extend({

  className: 'Table-head',
  tagName: 'table',

  initialize: function (opts) {
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.tableViewModel) throw new Error('tableViewModel is required');

    this._columnsCollection = opts.columnsCollection;
    this._tableViewModel = opts.tableViewModel;
    this._querySchemaModel = opts.querySchemaModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(template());
    this._columnsCollection.each(this._renderColumnHead, this);
    return this;
  },

  _initBinds: function () {
    this._columnsCollection.bind('reset', this.render, this);
    this.add_related_model(this._columnsCollection);
  },

  _renderColumnHead: function (mdl) {
    var geom = this._querySchemaModel.getGeometry();
    var simpleGeometry = geom && geom.getSimpleType();
    if (!this._tableViewModel.isDisabled() && mdl.get('name') === 'the_geom_webmercator') {
      return;
    }

    var view = new TableHeadItemView({
      model: mdl,
      columnsCollection: this._columnsCollection,
      tableViewModel: this._tableViewModel,
      simpleGeometry: simpleGeometry
    });
    this.$('.js-headRow').append(view.render().el);
    this.addView(view);
  }

});
