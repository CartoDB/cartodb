var cdb = require('cartodb.js');
var TableHeadItemView = require('./table-head-item-view');

/*
 *  Main table view
 */

module.exports = cdb.core.View.extend({

  className: 'Table-header',
  tagName: 'thead',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;

    this._columnsCollection = this._querySchemaModel.columnsCollection;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append('<tr></tr>');
    this._columnsCollection.each(this._renderColumnHead, this);
    return this;
  },

  _initBinds: function () {
    this._columnsCollection.bind('reset', this.render, this);
    this.add_related_model(this._columnsCollection);
  },

  _renderColumnHead: function (mdl) {
    var view = new TableHeadItemView({
      model: mdl
    });
    this.$('tr').append(view.render().el);
    this.addView(view);
  }

});
