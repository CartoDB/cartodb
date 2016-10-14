var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-content.tpl');
var EditFeatureHeaderView = require('./edit-feature-content-views/edit-feature-header-view');
var EditFeatureFormView = require('./edit-feature-content-views/edit-feature-form-view');
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
    if (!opts.cdbid) throw new Error('cdbid is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._configModel = opts.configModel;
    this._cdbid = opts.cdbid;

    this._featureModel = new Backbone.Model();

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
    var geom = JSON.parse(this._featureModel.get('the_geom'));

    this._renderHeader(geom);
    this._renderForm();
  },

  _initBinds: function () {
    this._featureModel.bind('change:the_geom', function () {
      console.log(this._featureModel.get('the_geom'));

      this._renderInfo();
    }, this);
  },

  _initViews: function () {
    this._getRow();
  },

  _renderHeader: function (geom) {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new EditFeatureHeaderView({
      url: this._url,
      tableName: this._tableName,
      type: geom.type
    });
    this.addView(this._headerView);
    this.$('.js-editFeatureHeader').html(this._headerView.render().el);
  },

  _renderForm: function () {
    if (this._editFeatureFormView) {
      this.removeView(this._editFeatureFormView);
      this._editFeatureFormView.clean();
    }
    this._editFeatureFormView = new EditFeatureFormView({
      model: this._featureModel
    });
    this.addView(this._editFeatureFormView);
    this.$('.js-editFeatureContent').html(this._editFeatureFormView.render().el);
  },

  // _renderForm: function () {
  //   if (this._editFeatureFormView) {
  //     this.removeView(this._editFeatureFormView);
  //     this._editFeatureFormView.clean();
  //   }

  //   this._editFeatureFormView = new EditFeatureFormView({
  //     model: this._featureModel
  //   });

  //   this.addView(this._editFeatureFormView);
  //   this.$('.js-editFeatureContent').html(this._editFeatureFormView.render().el);
  // },

  _getRow: function () {
    var self = this;

    // Get row data and show the content
    if (this.row) {
      this.row.unbind(null, null, this);
    }

    this.row = new QueryRowModel({ cartodb_id: this._cdbid }, {
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
