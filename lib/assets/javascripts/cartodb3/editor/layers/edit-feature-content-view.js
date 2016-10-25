var CoreView = require('backbone/core-view');
var template = require('./edit-feature-content.tpl');
var EditFeatureActionView = require('./edit-feature-content-views/edit-feature-action-view');
var EditFeatureControlView = require('./edit-feature-content-views/edit-feature-control-view');
var EditFeatureHeaderView = require('./edit-feature-content-views/edit-feature-header-view');
var VisTableModel = require('../../data/visualization-table-model');
var EditFeatureInnerView = require('./edit-feature-content-views/edit-feature-inner-view');
var PanelWithOptionsView = require('../../components/view-options/panel-with-options-view');
var ScrollView = require('../../components/scroll/scroll-view');

var REQUIRED_OPTS = [
  'stackLayoutModel',
  'layerDefinitionModel',
  'configModel',
  'mapModeModel',
  'editorModel'
];

module.exports = CoreView.extend({

  className: 'Editor-content',

  events: {
    'click .js-back': 'clean'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

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
    var self = this;

    if (this._querySchemaModel.get('status') !== 'fetched') {
      // status can be: fetched, unavailable, fetching
      this._querySchemaModel.bind('change:status', this.render, this);
      this._querySchemaModel.fetch();
    }
    this._featureModel.bind('change:the_geom', this.render, this);
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
    this._renderContent();
  },

  _renderHeader: function () {
    if (this._headerView) {
      this.removeView(this._headerView);
      this._headerView.clean();
    }

    this._headerView = new EditFeatureHeaderView({
      url: this._url,
      tableName: this._tableName,
      model: this._featureModel
    });
    this.addView(this._headerView);
    this.$('.js-editFeatureHeader').html(this._headerView.render().el);
  },

  _renderContent: function () {
    var self = this;

    if (this._contentView) {
      this.removeView(this._contentView);
      this._contentView.clean();
    }

    this._contentView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new EditFeatureInnerView({
              model: self._featureModel,
              columnsCollection: self._sourceNode.querySchemaModel.columnsCollection
            });
          }
        });
      },
      createControlView: function () {
        return new EditFeatureControlView();
      },
      createActionView: function () {
        return new EditFeatureActionView({
          featureModel: self._featureModel,
          model: self.model
        });
      }
    });
    this.addView(this._contentView);
    this.$('.js-editFeatureContent').html(this._contentView.render().el);
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

      this._querySchemaModel = this._sourceNode.querySchemaModel;
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

  clean: function () {
    this._mapModeModel.enterViewingMode();
    CoreView.prototype.clean.apply(this);
  }
});
