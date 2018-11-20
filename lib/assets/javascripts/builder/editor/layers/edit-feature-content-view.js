var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-content.tpl');
var EditFeatureActionView = require('./edit-feature-content-views/edit-feature-action-view');
var EditFeatureControlView = require('./edit-feature-content-views/edit-feature-control-view');
var EditFeatureHeaderView = require('./edit-feature-content-views/edit-feature-header-view');
var VisTableModel = require('builder/data/visualization-table-model');
var EditFeatureInnerView = require('./edit-feature-content-views/edit-feature-inner-view');
var PanelWithOptionsView = require('builder/components/view-options/panel-with-options-view');
var ScrollView = require('builder/components/scroll/scroll-view');
var Notifier = require('builder/components/notifier/notifier');
var EditFeatureGeometryFormModel = require('./edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureGeometryPointFormModel = require('./edit-feature-content-views/edit-feature-geometry-point-form-model');
var EditFeatureAttributesFormModel = require('./edit-feature-content-views/edit-feature-attributes-form-model');

var StyleHelper = require('builder/helpers/style');
var StyleConstants = require('builder/components/form-components/_constants/_style');
var StylesFactory = require('builder/editor/style/styles-factory');

var Router = require('builder/routes/router');

var NOTIFICATION_ID = 'editFeatureNotification';
var NOTIFICATION_ERROR_TEMPLATE = _.template("<span class='u-errorTextColor'><%- title %></span>");

var REQUIRED_OPTS = [
  'stackLayoutModel',
  'layerDefinitionModel',
  'configModel',
  'mapModeModel',
  'editorModel',
  'modals'
];

var GEOMETRY_TYPE = 'simple_geom';

module.exports = CoreView.extend({

  className: 'Editor-content',

  events: {
    'click .js-back': 'cleanAndGoBack'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this._featureModel = this._mapModeModel.getFeatureDefinition();
    this._tableName = '';
    this._url = '';

    this._editorModel.set({
      edition: false
    });

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
    if (this._querySchemaModel.get('status') !== 'fetched') {
      // status can be: fetched, unavailable, fetching
      this._querySchemaModel.bind('change:status', this.render, this);
      this._querySchemaModel.fetch();
    }

    this._queryGeometryModel.bind('change:' + GEOMETRY_TYPE, this._checkNewLayerGeometryTypeDefinition, this);

    this.listenTo(this._editorModel, 'cancelPreviousEditions', this.clean);

    this.listenTo(this._featureModel, 'updateFeature', this._updateForms);
    this.listenTo(this._featureModel, 'destroyFeature', this._onDestroyFeature);
    this.listenTo(this._featureModel, 'destroyFeatureSuccess', this._onDestroyFeatureSuccess);
    this.listenTo(this._featureModel, 'destroyFeatureFailed', this._onDestroyFeatureFailed);
    this.listenTo(this._featureModel, 'addFeature', this._onAddFeature);
    this.listenTo(this._featureModel, 'saveFeature', this._onSaveFeature);
    this.listenTo(this._featureModel, 'saveFeatureSuccess', this._onSaveFeatureSuccess);
    this.listenTo(this._featureModel, 'saveFeatureFailed', this._onSaveFeatureFailed);
  },

  _initViews: function () {
    if (this._featureModel.isNew()) {
      this._addRow();
    } else {
      this._renderInfo();
    }
  },

  _updateForms: function () {
    this._updateGeometry();
    this._attributesFormModel.trigger('updateFeature');
  },

  _updateGeometry: function () {
    var geojson = null;

    try {
      geojson = JSON.parse(this._featureModel.get('the_geom'));
    } catch (err) {
      // if the geom is not a valid json value
    }

    var attrs;

    if (this._featureModel.isPoint()) {
      attrs = {
        lng: geojson && geojson.coordinates[0],
        lat: geojson && geojson.coordinates[1]
      };
    } else {
      attrs = {
        the_geom: this._featureModel.get('the_geom')
      };
    }

    this._geometryFormModel.set(attrs);
    this._geometryFormModel.trigger('updateFeature', attrs);
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
      layerDefinitionModel: this._layerDefinitionModel,
      model: this._featureModel,
      modals: this._modals,
      isNew: this._featureModel.isNew(),
      backAction: this.cleanAndGoBack.bind(this)
    });
    this.addView(this._headerView);
    this.$('.js-editFeatureHeader').html(this._headerView.render().el);
  },

  _renderContent: function () {
    if (this._contentView) {
      this.removeView(this._contentView);
      this._contentView.clean();
    }

    var geojson = null;

    try {
      geojson = JSON.parse(this._featureModel.get('the_geom'));
    } catch (err) {
      // if the geom is not a valid json value
    }

    if (this._featureModel.isPoint()) {
      this._geometryFormModel = new EditFeatureGeometryPointFormModel({
        lng: geojson && geojson.coordinates[0],
        lat: geojson && geojson.coordinates[1]
      }, {
        featureModel: this._featureModel
      });
    } else {
      this._geometryFormModel = new EditFeatureGeometryFormModel({
        the_geom: this._featureModel.get('the_geom')
      }, {
        featureModel: this._featureModel
      });
    }

    this._attributesFormModel = new EditFeatureAttributesFormModel(this._featureModel.toJSON(), {
      featureModel: this._featureModel,
      columnsCollection: this._sourceNode.querySchemaModel.columnsCollection,
      configModel: this._configModel,
      nodeDefModel: this._layerDefinitionModel.getAnalysisDefinitionNodeModel()
    });

    this._contentView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: this._editorModel,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new EditFeatureInnerView({
              featureModel: this._featureModel,
              geometryFormModel: this._geometryFormModel,
              attributesFormModel: this._attributesFormModel
            });
          }.bind(this)
        });
      }.bind(this),
      createControlView: function () {
        return new EditFeatureControlView();
      },
      createActionView: function () {
        return new EditFeatureActionView({
          model: this.model,
          featureModel: this._featureModel,
          geometryFormModel: this._geometryFormModel,
          attributesFormModel: this._attributesFormModel
        });
      }.bind(this)
    });
    this.addView(this._contentView);
    this.$('.js-editFeatureContent').html(this._contentView.render().el);
  },

  _onDestroyFeature: function () {
    if (Notifier.getNotification(NOTIFICATION_ID)) {
      Notifier.removeNotification(NOTIFICATION_ID);
    }

    this.notification = Notifier.addNotification({
      id: NOTIFICATION_ID,
      status: 'loading',
      info: _t('notifications.edit-feature.destroy.loading'),
      closable: false
    });
  },

  _onDestroyFeatureSuccess: function () {
    this._onUpdateFeature('destroy');

    this.notification.set({
      status: 'success',
      info: _t('notifications.edit-feature.destroy.success'),
      closable: true
    });

    var layerId = this._layerDefinitionModel.get('id');
    Router.goToStyleTab(layerId);
  },

  _onDestroyFeatureFailed: function (mdl, error) {
    this.notification.set({
      status: 'error',
      info: NOTIFICATION_ERROR_TEMPLATE({
        title: _t('notifications.edit-feature.destroy.error')
      }),
      closable: true
    });
  },

  _onAddFeature: function () {
    if (Notifier.getNotification(NOTIFICATION_ID)) {
      Notifier.removeNotification(NOTIFICATION_ID);
    }

    this.notification = Notifier.addNotification({
      id: NOTIFICATION_ID,
      status: 'loading',
      info: _t('notifications.edit-feature.adding'),
      closable: false
    });
  },

  _onSaveFeature: function () {
    if (Notifier.getNotification(NOTIFICATION_ID)) {
      Notifier.removeNotification(NOTIFICATION_ID);
    }

    this.notification = Notifier.addNotification({
      id: NOTIFICATION_ID,
      status: 'loading',
      info: _t('notifications.edit-feature.save.loading'),
      closable: false
    });
  },

  _onSaveFeatureSuccess: function (operation, model) {
    this._onUpdateFeature(operation);
    this._needReloadVis() && this._mapModeModel.trigger('reloadVis');

    this.notification.set({
      status: 'success',
      info: _t('notifications.edit-feature.save.success'),
      closable: true
    });

    Router.editFeature(model);
  },

  _checkNewLayerGeometryTypeDefinition: function (queryGeometryModel, currentGeometryType) {
    var layerGeometryTypeHasBeenDefined = currentGeometryType && !(queryGeometryModel.previous(GEOMETRY_TYPE));

    if (layerGeometryTypeHasBeenDefined) {
      var defaultStyle = _.extend({ type: StyleConstants.Type.SIMPLE },
        StylesFactory.getDefaultStyleAttrsByType(StyleConstants.Type.SIMPLE, currentGeometryType)
      );
      this._layerDefinitionModel.styleModel.set(defaultStyle);
    }
  },

  _onSaveFeatureFailed: function (mdl, error) {
    this.notification.set({
      status: 'error',
      info: NOTIFICATION_ERROR_TEMPLATE({
        title: _t('notifications.edit-feature.save.error')
      }),
      closable: true
    });
  },

  _onUpdateFeature: function (operation) {
    var self = this;
    this._queryGeometryModel.hasValueAsync()
      .then(function (hasGeom) {
        if (operation !== 'save' || !hasGeom) {
          self._queryGeometryModel.resetFetch();
        }
      });

    if (operation === 'add' || operation === 'destroy') {
      this._rowsCollection.resetFetch();
    }
  },

  _needReloadVis: function () {
    var style = this._layerDefinitionModel.styleModel;
    var color = StyleHelper.getColorAttribute(style);
    var size = StyleHelper.getSizeAttribute(style);
    var changed = _.keys(this._featureModel.changedAttributes());
    return (color && _.contains(changed, color) || size && _.contains(changed, size));
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
      this._queryGeometryModel = this._sourceNode.queryGeometryModel;
      this._rowsCollection = this._sourceNode.queryRowsCollection;
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

  _destroyContextOverlay: function () {
    $('.js-editOverlay').fadeOut(200, function () {
      $('.js-editOverlay').remove();
    });
  },

  cleanAndGoBack: function () {
    this.clean();
    this._mapModeModel.enterViewingMode();
    Router.goToPreviousRoute({
      options: { replace: true }
    });
  },

  clean: function () {
    this._destroyContextOverlay();
    CoreView.prototype.clean.apply(this);
  }
});
