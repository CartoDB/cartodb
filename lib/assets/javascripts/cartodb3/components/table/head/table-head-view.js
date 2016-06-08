var CoreView = require('backbone/core-view');
var TableHeadItemView = require('./table-head-item-view');

/*
 *  Main table view
 */

module.exports = CoreView.extend({

  className: 'Table-header',
  tagName: 'thead',

  initialize: function (opts) {
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._columnsCollection = opts.columnsCollection;
    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;

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
    if (!(this._querySchemaModel.get('query') && mdl.get('name') === 'the_geom_webmercator')) {
      var view = new TableHeadItemView({
        model: mdl
      });
      this.$('tr').append(view.render().el);
      this.addView(view);
    }
  }

});
