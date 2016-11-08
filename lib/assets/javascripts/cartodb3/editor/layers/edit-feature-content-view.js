var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-content.tpl');
var EditFeatureActionView = require('./edit-feature-content-views/edit-feature-action-view');
var EditFeatureControlView = require('./edit-feature-content-views/edit-feature-control-view');
var EditFeatureHeaderView = require('./edit-feature-content-views/edit-feature-header-view');
var VisTableModel = require('../../data/visualization-table-model');
var EditFeatureInnerView = require('./edit-feature-content-views/edit-feature-inner-view');
var PanelWithOptionsView = require('../../components/view-options/panel-with-options-view');
var ScrollView = require('../../components/scroll/scroll-view');
var Notifier = require('../../components/notifier/notifier');
var EditFeatureGeometryFormModel = require('./edit-feature-content-views/edit-feature-geometry-form-model');
var EditFeatureGeometryPointFormModel = require('./edit-feature-content-views/edit-feature-geometry-point-form-model');
var EditFeatureAttributesFormModel = require('./edit-feature-content-views/edit-feature-attributes-form-model');

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
    this._featureModel.bind('updateFeature', this._updateGeometry, this);
    this._featureModel.bind('destroyFeature', this._onDestroyFeature, this);
    this._featureModel.bind('destroyFeatureSuccess', this._onDestroyFeatureSuccess, this);
    this._featureModel.bind('destroyFeatureFailed', this._onDestroyFeatureFailed, this);
    this._featureModel.bind('addFeature', this._onAddFeature, this);
    this._featureModel.bind('saveFeature', this._onSaveFeature, this);
    this._featureModel.bind('saveFeatureSuccess', this._onSaveFeatureSuccess, this);
    this._featureModel.bind('saveFeatureFailed', this._onSaveFeatureFailed, this);

    this.add_related_model(this._featureModel);
  },

  _initViews: function () {
    if (this._featureModel.isNew()) {
      this._addRow();
    } else {
      this._renderInfo();
    }
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

  _updateGeometry: function () {
    var geojson = null;

    try {
      geojson = JSON.parse(this._featureModel.get('the_geom'));
    } catch (err) {
      // if the geom is not a valid json value
    }

    if (this._featureModel.isPoint()) {
      this._geometryFormModel.set({
        lng: geojson && geojson.coordinates[0],
        lat: geojson && geojson.coordinates[1]
      });
    } else {
      this._geometryFormModel.set({
        the_geom: this._featureModel.get('the_geom')
      });
    }
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
      model: this._featureModel,
      modals: this._modals,
      isNew: this._featureModel.isNew(),
      backAction: this.clean.bind(this)
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
      columnsCollection: self._sourceNode.querySchemaModel.columnsCollection
    });

    this._contentView = new PanelWithOptionsView({
      className: 'Editor-content',
      editorModel: self._editorModel,
      createContentView: function () {
        return new ScrollView({
          createContentView: function () {
            return new EditFeatureInnerView({
              model: self.model,
              featureModel: self._featureModel,
              geometryFormModel: self._geometryFormModel,
              attributesFormModel: self._attributesFormModel
            });
          }
        });
      },
      createControlView: function () {
        return new EditFeatureControlView();
      },
      createActionView: function () {
        return new EditFeatureActionView({
          model: self.model,
          featureModel: self._featureModel,
          geometryFormModel: self._geometryFormModel,
          attributesFormModel: self._attributesFormModel
        });
      }
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
    this.notification.set({
      status: 'success',
      info: _t('notifications.edit-feature.destroy.success'),
      closable: true
    });
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

  _onSaveFeatureSuccess: function () {
    this.render();

    this.notification.set({
      status: 'success',
      info: _t('notifications.edit-feature.save.success'),
      closable: true
    });
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

  _destroyContextOverlay: function () {
    $('.js-editOverlay').fadeOut(200, function () {
      $('.js-editOverlay').remove();
    });
  },

  clean: function () {
    this._destroyContextOverlay();
    this._mapModeModel.enterViewingMode();
    CoreView.prototype.clean.apply(this);
  }
});
