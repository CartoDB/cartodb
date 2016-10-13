var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-geometry-content.tpl');
var EditGeometryHeaderView = require('./edit-geometry-content-views/edit-geometry-header-view');
var EditGeometryFormView = require('./edit-geometry-content-views/edit-geometry-form-view');
var VisTableModel = require('../../data/visualization-table-model');
var QueryRowsCollection = require('../../data/query-rows-collection');

module.exports = CoreView.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('StackLayoutModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.cdbid) throw new Error('cdbid is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._configModel = opts.configModel;
    this._querySchemaModel = opts.querySchemaModel;
    this._cdbid = opts.cdbid;

    this._geometryModel = new Backbone.Model();
    this._geometryModel.bind('change', this._renderInfo, this);

    this._tableName = '';
    this._url = '';

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

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    this._initViews();

    return this;
  },

  _renderInfo: function () {
    this._renderHeader();
    this._renderForm();
  },

  _initViews: function () {
    this._getRow();
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new EditGeometryHeaderView({
      url: this._url,
      tableName: this._tableName,
      type: this._geometryModel.get('type')
    });
    this.addView(this._headerView);
    this.$('.js-editGeometryHeader').html(this._headerView.render().el);
  },

  _getRow: function () {
    var self = this;;

    // Get row data and show the content
    if(this.row) {
      this.row.unbind(null, null, this);
    }

    var rowsCollection = new QueryRowsCollection([], {
      configModel: this._configModel,
      tableName: this._tableName,
      querySchemaModel: this._querySchemaModel
    });

    this.row = rowsCollection.getRow(this._cdbid);

    this.row
      .fetch({
        success: function(data) {
          self._geometryModel.set(JSON.parse(data.get('the_geom')))
          console.log(data);
        }
      });
  },

  _renderForm: function () {
    if (this._editGeometryFormView) {
      this.removeView(this._editGeometryFormView);
      this._editGeometryFormView.clean();
    }
    this._editGeometryFormView = new EditGeometryFormView({
      model: this._geometryModel
    });
    this.addView(this._editGeometryFormView);
    this.$('.js-editGeometryContent').append(this._editGeometryFormView.render().el);
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
