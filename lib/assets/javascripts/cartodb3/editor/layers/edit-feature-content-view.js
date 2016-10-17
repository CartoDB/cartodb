var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-content.tpl');
var EditFeatureHeaderView = require('./edit-feature-content-views/edit-feature-header-view');
var EditFeatureGeometryFormView = require('./edit-feature-content-views/edit-feature-geometry-form-view');
var EditFeatureAttributesFormView = require('./edit-feature-content-views/edit-feature-attributes-form-view');
var VisTableModel = require('../../data/visualization-table-model');
var QueryRowModel = require('../../data/query-row-model');

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._configModel = opts.configModel;
    this._featureModel = opts.featureModel;

    this._tableName = '';
    this._url = '';

    this._initBinds();

    this._getTable();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();

    return this;
  },

  _renderInfo: function () {
    this._renderHeader();
    this._renderGeometryForm();
    this._renderAttributesForm();
  },

  _initBinds: function () {
    this._featureModel.bind('change', function () {
      this._renderInfo();
      console.log(this._featureModel.toJSON());
    }, this);
    this.add_related_model(this._featureModel);
  },

  _initViews: function () {
    var cartodb_id = this._featureModel.get('cartodb_id');

    if (cartodb_id) {
      this._getRow(cartodb_id);
    } else {
      this._addRow();
    }
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    var type = this._featureModel.get('the_geom') && JSON.parse(this._featureModel.get('the_geom')).type;

    this._headerView = new EditFeatureHeaderView({
      url: this._url,
      tableName: this._tableName,
      type: type
    });
    this.addView(this._headerView);
    this.$('.js-editFeatureHeader').html(this._headerView.render().el);
  },

  _renderGeometryForm: function () {
    if (this._editFeatureGeometryFormView) {
      this.removeView(this._editFeatureGeometryFormView);
      this._editFeatureGeometryFormView.clean();
    }
    this._editFeatureGeometryFormView = new EditFeatureGeometryFormView({
      model: this._featureModel
    });
    this.addView(this._editFeatureGeometryFormView);
    this.$('.js-editFeatureGeometryContent').html(this._editFeatureGeometryFormView.render().el);
  },

  _renderAttributesForm: function () {
    if (this._editFeatureAttributesFormView) {
      this.removeView(this._editFeatureAttributesFormView);
      this._editFeatureAttributesFormView.clean();
    }
    this._editFeatureAttributesFormView = new EditFeatureAttributesFormView({
      model: this._featureModel,
      columnsCollection: this._sourceNode.querySchemaModel.columnsCollection
    });
    this.addView(this._editFeatureAttributesFormView);
    this.$('.js-editFeatureAttributesContent').html(this._editFeatureAttributesFormView.render().el);
  },

  _getRow: function (cartodb_id) {
    var self = this;

    // Get row data and show the content
    if (this.row) {
      this.row.unbind(null, null, this);
    }

    this.row = new QueryRowModel({ cartodb_id: cartodb_id }, {
      tableName: this._tableName,
      configModel: this._configModel
    });

    this.row
      .fetch({
        success: function (data) {
          self._featureModel.set(data.toJSON());
        }
      });
  },

  _addRow: function () {
    var self = this;

    if (this.row) {
      this.row.unbind(null, null, this);
    }

    this.row = new QueryRowModel({}, {
      tableName: this._tableName,
      configModel: this._configModel
    });

    this._renderInfo();
  },

  _getTable: function () {
    this._sourceNode = this._getSourceNode();

    if (this._sourceNode) {
      var tableName = this._sourceNode.get('table_name');
      this._visTableModel = new VisTableModel({
        id: tableName,
        table: {
          name: tableName
        }
      }, {
        configModel: this._configModel
      });
    }

    if (this._visTableModel) {
      var tableModel = this._visTableModel.getTableModel();
      this._tableName = tableModel.getUnquotedName();
      this._url = this._visTableModel && this._visTableModel.datasetURL();
    }
  },

  _getSourceNode: function () {
    var node = this._layerDefinitionModel.getAnalysisDefinitionNodeModel();
    var source;
    if (node.get('type') === 'source') {
      source = node;
    } else {
      var primarySource = node.getPrimarySource();
      if (primarySource && primarySource.get('type') === 'source') {
        source = primarySource;
      }
    }

    return source;
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep(this._layerDefinitionModel, 'layer-content');
  }

});
