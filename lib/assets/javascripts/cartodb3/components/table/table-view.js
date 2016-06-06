var cdb = require('cartodb.js');
var TableViewModel = require('./table-view-model.js');
var TableHeadView = require('./head/table-head-view');
var TableBodyView = require('./body/table-body-view');

/*
 *  Main table view
 */

module.exports = cdb.core.View.extend({

  options: {
    readonly: false,
    disabled: false
  },

  className: 'Table',
  tagName: 'table',

  initialize: function (opts) {
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;

    this.tableViewModel = new TableViewModel();

    if (this._querySchemaModel.get('status') === 'unfetched') {
      this._querySchemaModel.fetch();
    }

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._querySchemaModel.bind('change:status', this._onQuerySchemaChanged, this);
    this.add_related_model(this._querySchemaModel);
  },

  _initViews: function () {
    var tableHeadView = new TableHeadView({
      querySchemaModel: this._querySchemaModel,
      configModel: this._configModel
    });

    this.addView(tableHeadView);
    this.$el.append(tableHeadView.render().el);

    var tableBodyView = new TableBodyView({
      querySchemaModel: this._querySchemaModel,
      tableViewModel: this.tableViewModel,
      configModel: this._configModel
    });

    this.addView(tableBodyView);
    this.$el.append(tableBodyView.render().el);
  },

  _onQuerySchemaChanged: function () {
    this.tableViewModel.setDefaults();
  }

});
