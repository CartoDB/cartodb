var $ = require('jquery');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var FeatureDefinitionModel = require('builder/data/feature-definition-model');
var AppNotifications = require('builder/app-notifications');

var REQUIRED_OPTS = [
  'configModel',
  'diDashboardHelpers',
  'editFeatureOverlay',
  'layerDefinitionsCollection',
  'mapModeModel',
  'userModel'
];

/**
 *  Only manage **FEATURES** actions or behaviours between Deep-Insights
 *  (CARTO.js) and Builder
 *
 */

module.exports = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    var visMap = this._diDashboardHelpers.visMap();
    var mapModel = this._diDashboardHelpers.getMap();

    this._mapModeModel.on('change:mode', this._onMapModeChanged, this);
    this._mapModeModel.on('reloadVis', function () {
      this._diDashboardHelpers.invalidateMap();
    }, this);

    mapModel.on('click', this._onFeatureOut, this);
    visMap.on('featureClick', this._onFeatureClicked, this);
    visMap.on('featureError', this._onFeatureError, this);
  },

  _onFeatureError: function (error) {
    if (error && error.type === 'limit') {
      AppNotifications.addNotification({
        type: 'interactivity'
      });
    }
  },

  _onFeatureOut: function () {
    this._editFeatureOverlay.hide();
  },

  _onFeatureClicked: function (event) {
    var layerId = event.layer.id;
    var featureId = event.feature.cartodb_id;
    var position = event.position;
    var layerDefinitionModel = this._layerDefinitionsCollection.get(layerId);
    var isFeatureBeingEdited = false;

    var featureDefinition = new FeatureDefinitionModel({
      cartodb_id: featureId
    }, {
      configModel: this._configModel,
      layerDefinitionModel: layerDefinitionModel,
      userModel: this._userModel
    });

    if (this._mapModeModel.isEditingFeatureMode()) {
      var editingFeatureDefinitionModel = this._mapModeModel.getFeatureDefinition();
      isFeatureBeingEdited = featureDefinition.isEqual(editingFeatureDefinitionModel);
    }

    if (!isFeatureBeingEdited) {
      this._editFeatureOverlay.setPosition(position);
      this._editFeatureOverlay.setFeatureDefinition(featureDefinition);
      this._editFeatureOverlay
        .render()
        .show();
    }
  },

  _onMapModeChanged: function (mapModeModel) {
    var map = this._diDashboardHelpers.visMap();
    var featureDefinition;
    var geometry;

    // VIEWING MODE
    if (mapModeModel.isViewingMode()) {
      map.stopDrawingGeometry();
      map.stopEditingGeometry();
    }

    // DRAWING FEATURES
    if (mapModeModel.isDrawingFeatureMode()) {
      featureDefinition = mapModeModel.getFeatureDefinition();
      if (featureDefinition.isPoint()) {
        geometry = map.drawPoint();
      } else if (featureDefinition.isLine()) {
        geometry = map.drawPolyline();
      } else if (featureDefinition.isPolygon()) {
        geometry = map.drawPolygon();
      }

      if (!geometry) {
        throw new Error("couldn't get geometry for feature of type " + featureDefinition.get('type'));
      }
    }

    // EDITING FEATURES
    if (mapModeModel.isEditingFeatureMode()) {
      featureDefinition = mapModeModel.getFeatureDefinition();
      var geojson = JSON.parse(featureDefinition.get('the_geom'));
      geometry = map.editGeometry(geojson);
    }

    if (featureDefinition && geometry) {
      this._bindGeometryToFeatureDefinition(geometry, featureDefinition);
      featureDefinition.on('save', function () {
        if (featureDefinition.hasBeenChangedAfterLastSaved('the_geom') || featureDefinition.hasBeenChangedAfterLastSaved('cartodb_id')) {
          this._diDashboardHelpers.invalidateMap();
          geometry.setCoordinatesFromGeoJSON(JSON.parse(featureDefinition.get('the_geom')));
        }
      }, this);
      featureDefinition.on('remove', function () {
        this._diDashboardHelpers.invalidateMap();
      }, this);
    }
  },

  _bindGeometryToFeatureDefinition: function (geometry, featureDefinition) {
    geometry.on('change', function () {
      if (geometry.isComplete()) {
        $('.js-editOverlay').fadeOut(200, function () {
          $('.js-editOverlay').remove();
        });

        var geojson = geometry.toGeoJSON();
        geojson = geojson.geometry || geojson;
        featureDefinition.set({
          the_geom: JSON.stringify(geojson)
        });
        featureDefinition.trigger('updateFeature');
      }
    });
  }
};
