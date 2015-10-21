
/**
 *  Default widget view:
 *
 *  It contains:
 *  - view model (viewModel)
 *  - datasource model (datasource)
 *  - data model (dataModel)
 *
 *  It will offet to the user:
 *  - get current data (getData)
 *  - filter the current datasource (filter), each view will let
 *  different possibilities.
 *  - Sync or unsync widget (sync/unsync), making the proper view
 *  listen or not changes from the current datasource.
 *
 */

cdb.geo.ui.Widget.View = cdb.core.View.extend({

  className: 'Widget Widget--light',

  options: {
    columns_title: [],
    sync: true
  },

  initialize: function() {
    if (!this.options.datasource) {
      throw new Error('Datasource is not defined');
    }
    this.viewModel = new cdb.core.Model({
      title: this.options.title,
      type: this.options.type,
      sync: this.options.sync,
      columns_title: this.options.columns_title
    });
    this.datasource = this.options.datasource;
    this.dataModel = this.datasource.addWidgetModel({
      id: this.options.id,
      sql: this.options.sql,
      name: this.options.name,
      type: this.options.type,
      columns: this.options.columns
    });
  },

  render: function() {
    this._initViews();
    return this;
  },

  _initViews: function() {
    this._loader = new cdb.geo.ui.Widget.Loader({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
    this.$el.append(this._loader.render().el);
    this.addView(this._loader);

    this._error = new cdb.geo.ui.Widget.Error({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
    this._error.bind('refreshData', function() {
      console.log("refresh data man!");
    }, this);
    this.$el.append(this._error.render().el);
    this.addView(this._error);

    var content = this._createContentView();
    this.$el.append(content.render().el);
    this.addView(content);
  },

  // Generate and return content view.
  // In this case it will be the standard widget content.
  _createContentView: function() {
    return new cdb.geo.ui.Widget.Content({
      viewModel: this.viewModel,
      dataModel: this.dataModel
    });
  },

  sync: function() {
    this.viewModel.set('sync', true);
  },

  unsync: function() {
    this.viewModel.set('sync', false);
  },

  getData: function() {
    return this.dataModel.get('data');
  },

  filter: function() {
    throw new Error('Filter method not implemented for ' + this.dataModel.get('type') + ' Widget type');
  },

  clean: function() {
    this._unbindDatasource();
    this.viewModel.unbind(null, null, this);
    cdb.geo.ui.Widget.View.prototype.clean.call(this);
  }

});
