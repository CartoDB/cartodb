var _ = require('underscore');
var checkAndBuildOpts = require('../helpers/required-opts');
var WidgetsService = require('../editor/widgets/widgets-service');
var WidgetDefinitionModel = require('../data/widget-definition-model');
var WidgetsNotifications = require('../widgets-notifications');
var getStylesWithoutAutostyles = require('../helpers/styles-without-autostyle');

var WIDGET_STYLE_PARAMS = [
  'widget_style_definition',
  'auto_style_definition',
  'auto_style_allowed'
];

var REQUIRED_OPTS = [
  'diDashboardHelpers',
  'layerDefinitionsCollection',
  'widgetDefinitionsCollection',
  'analysisDefinitionNodesCollection'
];

/**
 *  Only manage **WIDGET** actions between Deep-Insights (CARTO.js) and Builder
 *
 */

module.exports = {

  track: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._getStylesWithoutAutostyles = getStylesWithoutAutostyles();

    this._widgetDefinitionsCollection.on('add', this._onWidgetDefinitionAdded, this);
    this._widgetDefinitionsCollection.on('sync', this._onWidgetDefinitionSynced, this);
    this._widgetDefinitionsCollection.on('change', this._onWidgetDefinitionChanged, this);
    this._widgetDefinitionsCollection.on('destroy', this._onWidgetDefinitionDestroyed, this);
    this._widgetDefinitionsCollection.on('add remove reset', this._invalidateSize, this);
    this._widgetDefinitionsCollection.on('setSelected', this._setSelectedWidget, this);

    this._widgetDefinitionsCollection.each(this._onWidgetDefinitionAdded, this);

    WidgetsNotifications.track(this._widgetDefinitionsCollection);

    return this;
  },

  _invalidateSize: function () {
    var vis = this._diDashboardHelpers.getMap();
    vis.invalidateSize();
  },

  _onWidgetDefinitionAdded: function (model) {
    var widgetModel = this._diDashboardHelpers.getWidget(model.id);
    if (widgetModel) {
      var layerDefModel = this._layerDefinitionsCollection.findWhere({ id: model.get('layer_id') });

      widgetModel.set({
        show_source: true,
        show_stats: true,
        show_options: true,
        table_name: layerDefModel.get('table_name')
      });

      this._bindWidgetChanges(widgetModel);
    }
  },

  _onWidgetDefinitionSynced: function (m) {
    var widgetModel = this._diDashboardHelpers.getWidget(m.id);
    if (!widgetModel) {
      this._createWidgetModel(m);
    }
  },

  _onWidgetAutoStyleColorChanged: function (m) {
    var isAutoStyleApplied = m.isAutoStyle();
    var autoStyleInfo = m.getAutoStyle();
    var layerId = m.layerModel.id;
    var layerDefModel = this._layerDefinitionsCollection.findWhere({ id: layerId });
    var nodeDefModel = layerDefModel && layerDefModel.getAnalysisDefinitionNodeModel();
    var styleModel = layerDefModel && layerDefModel.styleModel;
    var geometryType = nodeDefModel && nodeDefModel.get('simple_geom');

    if (layerDefModel) {
      layerDefModel.set({
        autoStyle: isAutoStyleApplied ? m.id : false,
        cartocss: autoStyleInfo.cartocss
      });
    }

    if (isAutoStyleApplied && styleModel && geometryType) {
      styleModel.setPropertiesFromAutoStyle({
        definition: autoStyleInfo.definition,
        geometryType: geometryType,
        widgetId: m.id
      });
    }
  },

  _onWidgetAutoStyleChanged: function (m) {
    var isAutoStyleApplied = m.isAutoStyle();
    var autoStyleInfo = m.getAutoStyle();
    var layerId = m.layerModel.id;
    var layerDefModel = this._layerDefinitionsCollection.findWhere({ id: layerId });
    var nodeDefModel = layerDefModel && layerDefModel.getAnalysisDefinitionNodeModel();
    var styleModel = layerDefModel && layerDefModel.styleModel;
    var onLayerChange = _.debounce(function () {
      var dontResetStyles = true; // In order to make it more visible
      m.cancelAutoStyle(dontResetStyles);
    }, 10);

    var stylesWithoutAutostyles = this._getStylesWithoutAutostyles(layerDefModel);

    if (layerDefModel && nodeDefModel) {
      if (isAutoStyleApplied) {
        layerDefModel.set({
          autoStyle: m.id
        });
      }
    } else {
      return;
    }

    if (isAutoStyleApplied) {
      var geometryType = nodeDefModel.get('simple_geom');
      styleModel.setPropertiesFromAutoStyle({
        definition: autoStyleInfo.definition,
        geometryType: geometryType,
        widgetId: m.id
      });

      layerDefModel.set(_.extend(
        {
          cartocss: autoStyleInfo.cartocss,
          cartocss_custom: false
        },
        stylesWithoutAutostyles
      ));

      layerDefModel.once('change:autoStyle change:cartocss', onLayerChange, this);
    } else {
      layerDefModel.unbind('change:autoStyle change:cartocss', onLayerChange, this);
      var autoStyleId = layerDefModel.get('autoStyle');

      if (autoStyleId && autoStyleId === m.id) {
        styleModel.resetPropertiesFromAutoStyle();

        layerDefModel.set({
          autoStyle: false,
          cartocss_custom: layerDefModel.get('previousCartoCSSCustom'),
          cartocss: layerDefModel.get('previousCartoCSS')
        });

        // Because we are messing with the autoStyle property on saving,
        // whenever we disable autoStyle, we save the layer to force
        // the sync on the cartocss
        layerDefModel.save();
      }
    }
  },

  _onWidgetCustomAutoStyleColorChanged: function (m) {
    var isAutoStyleApplied = m.isAutoStyle();
    var autoStyleInfo = m.getAutoStyle();
    var layerId = m.layerModel.id;
    var layerDefModel = this._layerDefinitionsCollection.findWhere({ id: layerId });
    var nodeDefModel = layerDefModel && layerDefModel.getAnalysisDefinitionNodeModel();
    var styleModel = layerDefModel && layerDefModel.styleModel;

    if (isAutoStyleApplied) {
      var geometryType = nodeDefModel.get('simple_geom');
      styleModel.setPropertiesFromAutoStyle({
        definition: autoStyleInfo.definition,
        geometryType: geometryType,
        widgetId: m.id
      });

      layerDefModel.set({
        cartocss: autoStyleInfo.cartocss,
        cartocss_custom: false
      }, {silent: true});

      // In order to make legends aware
      styleModel.trigger('style:update');
    }
  },

  _onWidgetDefinitionChanged: function (m) {
    var widgetModel = this._diDashboardHelpers.getWidget(m.id);

    // Only try to update if there's a corresponding widget model
    // E.g. the change of type will remove the model and provoke change events, which are not of interest (here),
    // since the widget model should be re-created for the new type anyway.
    if (widgetModel) {
      if (m.hasChanged('type')) {
        widgetModel.remove();
        this._createWidgetModel(m);
      } else {
        var attrs = this._formatWidgetAttrs(m.changedAttributes(), m);
        widgetModel.update(attrs);
      }
    }

    var colorChanged = !m.get('widget_color_changed') &&
                        m.changedAttributes() &&
                        m.changedAttributes().widget_style_definition &&
                        m.changedAttributes().widget_style_definition.color;

    if (colorChanged) {
      m.set({ widget_color_changed: true });
    }
  },

  _onWidgetDefinitionDestroyed: function (m) {
    var widgetModel = this._diDashboardHelpers.getWidget(m.id);

    if (widgetModel) {
      if (widgetModel.isAutoStyle()) {
        widgetModel.cancelAutoStyle();
      }
      this._unbindWidgetChanges(widgetModel);
      widgetModel.remove();
    }
  },

  _setSelectedWidget: function (selectedWidgetId) {
    var collection = this._diDashboardHelpers.getWidgets();

    collection.forEach(function (widget) {
      widget.trigger('setDisabled', widget, selectedWidgetId);
    });
  },

  _onEditWidget: function (m) {
    var widgetDefModel = this._widgetDefinitionsCollection.get(m.id);
    if (widgetDefModel) {
      WidgetsService.editWidget(widgetDefModel);
    }
  },

  _onRemoveWidget: function (m) {
    var widgetDefModel = this._widgetDefinitionsCollection.get(m.id);
    if (widgetDefModel) {
      WidgetsService.removeWidget(widgetDefModel);
    }
  },

  _bindWidgetChanges: function (m) {
    m.bind('editWidget', this._onEditWidget, this);
    m.bind('removeWidget', this._onRemoveWidget, this);
    m.bind('customAutoStyle', this._onWidgetCustomAutoStyleColorChanged, this);
    m.bind('change:autoStyle', this._onWidgetAutoStyleChanged, this);
    m.bind('change:color', this._onWidgetAutoStyleColorChanged, this);
  },

  _unbindWidgetChanges: function (m) {
    m.unbind('editWidget', this._onEditWidget, this);
    m.unbind('removeWidget', this._onRemoveWidget, this);
    m.unbind('customAutoStyle', this._onWidgetCustomAutoStyleColorChanged, this);
    m.unbind('change:autoStyle', this._onWidgetAutoStyleChanged, this);
    m.unbind('change:color', this._onWidgetAutoStyleColorChanged, this);
  },

  _createWidgetModel: function (model) {
    // e.g. 'time-series' => createTimeSeriesWidget
    var infix = model.get('type').replace(/(^\w|-\w)/g, function (match) {
      return match.toUpperCase().replace('-', '');
    });
    var methodName = 'create' + infix + 'Widget';

    var layerId = model.get('layer_id');
    var layerModel = this._diDashboardHelpers.getLayer(layerId);
    var layerDefModel = this._layerDefinitionsCollection.findWhere({ id: layerId });
    var attrs = this._formatWidgetAttrs(model.attributes, model);

    var widgetModel = this._diDashboardHelpers.getDashboard()[methodName](attrs, layerModel);

    if (widgetModel) {
      widgetModel.set({
        show_source: true,
        show_stats: true,
        show_options: true,
        table_name: layerDefModel.get('table_name')
      });

      this._bindWidgetChanges(widgetModel);
    }
  },

  /**
   * Massage some data points to the expected format of deep-insights API
   */
  _formatWidgetAttrs: function (changedAttrs, widgetDefModel) {
    var formattedAttrs = changedAttrs;

    // Source formatting
    if (_.isString(formattedAttrs.source)) {
      formattedAttrs = _.omit(formattedAttrs, 'source');
      formattedAttrs.source = this._diDashboardHelpers.getAnalysisByNodeId(changedAttrs.source);
    }

    // Widget style or auto style changes
    var thereIsWidgetStyleChange = _.find(formattedAttrs, function (value, key) {
      return _.contains(WIDGET_STYLE_PARAMS, key);
    });

    if (!_.isUndefined(thereIsWidgetStyleChange)) {
      formattedAttrs = _.omit(formattedAttrs, WIDGET_STYLE_PARAMS);
      formattedAttrs.style = widgetDefModel.toJSON().style;
    }

    return formattedAttrs;
  },

  manageTimeSeriesForTorque: function (m) {
    function recreateWidget (currentTimeseries, newLayer, animated) {
      var persistName = currentTimeseries && currentTimeseries.get('title');
      // This prevents a bug if user has a range selected and switches column
      newLayer.unset('customDuration');
      this._createTimeseries(newLayer, animated, persistName);
    }

    // not a cartodb layer
    if (!m.styleModel) return;
    var animatedChanged = m.styleModel.changedAttributes().animated;
    var previousAnimated = m.styleModel.previous('animated');
    var attributeChanged;
    if (animatedChanged && previousAnimated && animatedChanged.attribute !== previousAnimated.attribute) attributeChanged = animatedChanged.attribute;
    var typeChanged = m.styleModel.changedAttributes().type;
    var animatedAttribute = m.styleModel.get('animated') && m.styleModel.get('animated').attribute;
    var previousType = m.styleModel.previous('type');

    if (!typeChanged && !attributeChanged) return;

    var type = m.styleModel.get('type');
    var widgetModel = this._diDashboardHelpers.getWidgets().filter(function (m) {
      return m.get('type') === 'time-series';
    })[0];

    var currentTimeseries = this._getTimeseriesDefinition();
    var newLayer = this._diDashboardHelpers.getLayer(m.id);

    if (type !== 'animation' && previousType === 'animation' && this._lastType !== type) {
      if (widgetModel) {
        this._removeTimeseries();
      }

      this._lastType = type;
      this._lastTSAnimateChange = '';
    }

    if (type === 'animation' && (this._lastTSAnimateChange !== attributeChanged || this._lastType !== 'animation')) {
      if (widgetModel) {
        this._removeTimeseries();
      }

      if (newLayer.get('type') === 'torque' || m.get('type') === 'torque') {
        recreateWidget.call(this, currentTimeseries, newLayer, _.extend({ animated: true }, animatedChanged, { attribute: animatedAttribute }));
      }

      this._lastType = type;
      this._lastTSAnimateChange = attributeChanged;
    }
  },

  _removeTimeseries: function () {
    this._widgetDefinitionsCollection.models.forEach(function (def) {
      if (def.get('type') === 'time-series') {
        def.set({avoidNotification: true}, {silent: true});
        def.destroy();
      }
    });
  },

  _getTimeseriesDefinition: function () {
    return this._widgetDefinitionsCollection.findWhere({type: 'time-series'});
  },

  _createTimeseries: function (newLayer, animatedChanged, persist) {
    function getColumnType (sourceId, columnName) {
      var node = this._analysisDefinitionNodesCollection.get(sourceId);
      return node && node.querySchemaModel.getColumnType(columnName);
    }

    this._removeTimeseries();
    var attribute = animatedChanged && animatedChanged.attribute || '';
    var animated = animatedChanged && animatedChanged.animated;
    var sourceId = newLayer.get('source');
    var source = this._diDashboardHelpers.getAnalysisByNodeId(sourceId);
    if (attribute) {
      var baseAttrs = {
        type: 'time-series',
        layer_id: newLayer.get('id'),
        source: source,
        options: {
          column: attribute,
          title: persist || 'time_date__t',
          animated: animated
        },
        style: {
          widget_style: WidgetDefinitionModel.getDefaultWidgetStyle('time-series')
        }
      };

      var columnType = getColumnType.call(this, sourceId, attribute);
      if (columnType !== 'date') {
        baseAttrs.options.bins = 256;
      }

      this._widgetDefinitionsCollection.create(baseAttrs, { wait: true });
    }
  }
};
