
/**
 *  Default widget view:
 *
 *  It contains:
 *  - view model (viewModel)
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
    this.dataModel = this.model;
    this.viewModel = new cdb.core.Model({
      title: this.model.get('options').title,
      type: this.model.get('options').type,
      sync: this.model.get('options').sync,
      columns_title: this.model.get('options').columns_title
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
  }
});
