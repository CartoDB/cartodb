var CoreView = require('backbone/core-view');
var template = require('./edit-feature-content.tpl');
var EditFeatureHeaderView = require('./edit-feature-content-views/edit-feature-header-view');
var EditFeatureGeometryFormView = require('./edit-feature-content-views/edit-feature-geometry-form-view');
var EditFeatureAttributesFormView = require('./edit-feature-content-views/edit-feature-attributes-form-view');
var VisTableModel = require('../../data/visualization-table-model');
var EditFeatureControlsView = require('./edit-feature-content-views/edit-feature-controls-view');

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.mapModeModel) throw new Error('mapModeModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._configModel = opts.configModel;

    this._mapModeModel = opts.mapModeModel;
    this._featureModel = this._mapModeModel.getFeatureDefinition();

    this._tableName = '';
    this._url = '';

    this._getTable();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();

    return this;
  },

  _initBinds: function () {
    this._featureModel.bind('change', function () {
      this._renderInfo();
    }, this);
    this.add_related_model(this._featureModel);
  },

  _initViews: function () {
    if (this._featureModel.isNew()) {
      this._addRow();
    } else {
      this._renderInfo();
    }
  },

  _addRow: function () {
    this._renderInfo();
  },

  _renderInfo: function () {
    this._renderHeader();
    this._renderGeometryForm();
    this._renderAttributesForm();
    this._renderControlsView();
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new EditFeatureHeaderView({
      url: this._url,
      tableName: this._tableName,
      featureDefinitionModel: this._featureModel
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

  _renderControlsView: function () {
    if (this._editFeatureControlsView) {
      this.removeView(this._editFeatureControlsView);
      this._editFeatureControlsView.clean();
    }

    this._editFeatureControlsView = new EditFeatureControlsView({
      columnsCollection: this._sourceNode.querySchemaModel.columnsCollection,
      featureModel: this._featureModel
    });
    this.addView(this._editFeatureControlsView);
    this.$('.js-editFeatureControlsContent').html(this._editFeatureControlsView.render().el);
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
    this._mapModeModel.enterViewingMode();
  }
});
