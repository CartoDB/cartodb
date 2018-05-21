var _ = require('underscore');
var cdb = require('internal-carto.js');
var Dashboard = require('deep-insights/api/dashboard.js');
var DashboardView = require('deep-insights/dashboard-view');
var WidgetsCollection = require('deep-insights/widgets/widgets-collection');
var WidgetsService = require('deep-insights/widgets-service');
var URLHelper = require('deep-insights/api/url-helper');

/**
 * Translates a vizJSON v3 datastructure into a working dashboard which will be rendered in given selector.
 *
 * @param {String} selector e.g. "#foobar-id", ".some-class"
 * @param {Object} vizJSON JSON datastructure
 * @param {Object} opts (Optional) flags, see 3rd param for cdb.createVis for available ones. Keys used here:
 *   renderMenu: {Boolean} If true (default), render a top-level menu on the left side.
 * @return {Object} with keys:
 *   dashboardView: root (backbone) view of the dashboard
 *   vis: the instantiated vis map, same result as given from cdb.createVis()
 */
var createDashboard = function (selector, vizJSON, opts, callback) {
  var dashboardEl = document.querySelector(selector);
  if (!dashboardEl) throw new Error('no element found with selector ' + selector);

  // Default options
  opts = opts || {};
  opts.renderMenu = _.isBoolean(opts.renderMenu)
    ? opts.renderMenu
    : true;
  opts.autoStyle = _.isBoolean(opts.autoStyle)
    ? opts.autoStyle
    : false;

  var widgets = new WidgetsCollection();

  var model = new cdb.core.Model({
    title: vizJSON.title,
    description: vizJSON.description,
    updatedAt: vizJSON.updated_at,
    userName: vizJSON.user.fullname,
    userProfileURL: vizJSON.user.profile_url,
    userAvatarURL: vizJSON.user.avatar_url,
    renderMenu: opts.renderMenu,
    autoStyle: opts.autoStyle,
    showLogo: opts.cartodb_logo,
    initialPosition: {
      bounds: vizJSON.bounds
    }
  });
  var dashboardView = new DashboardView({
    el: dashboardEl,
    widgets: widgets,
    model: model
  });
  var dashboardState = opts.state || URLHelper.getStateFromCurrentURL();
  if (dashboardState && !_.isEmpty(dashboardState.map)) {
    if (_.isArray(dashboardState.map.center)) {
      vizJSON.center = dashboardState.map.center;
    }
    if (_.isNumber(dashboardState.map.zoom)) {
      vizJSON.zoom = dashboardState.map.zoom;
    }
    if (dashboardState.map.ne && dashboardState.map.sw) {
      vizJSON.bounds = [dashboardState.map.ne, dashboardState.map.sw];
    }
  }

  var vis = cdb.createVis(dashboardView.$('#map'), vizJSON, _.extend(opts, {
    skipMapInstantiation: true
  }));

  vis.once('load', function (vis) {
    var widgetsState = (dashboardState && dashboardState.widgets) || {};

    // Create widgets
    var widgetsService = new WidgetsService(widgets, vis.dataviews);

    var widgetModelsMap = {
      formula: widgetsService.createFormulaModel.bind(widgetsService),
      histogram: widgetsService.createHistogramModel.bind(widgetsService),
      'time-series': widgetsService.createTimeSeriesModel.bind(widgetsService),
      category: widgetsService.createCategoryModel.bind(widgetsService)
    };
    vizJSON.widgets.forEach(function (widget) {
      // Flatten the data structure given in vizJSON, the widgetsService will use whatever it needs and ignore the rest
      var attrs = _.extend({}, widget, widget.options);
      var newWidgetModel = widgetModelsMap[widget.type];
      var state = widgetsState[widget.id];

      if (_.isFunction(newWidgetModel)) {
        // Find the Layer that the Widget should be created for.
        var layer;
        var source;
        if (widget.layer_id) {
          layer = vis.map.layers.get(widget.layer_id);
        } else if (Number.isInteger(widget.layerIndex)) {
          // TODO Since namedmap doesn't have ids we need to map in another way, here using index
          //   should we solve this in another way?
          layer = vis.map.layers.at(widget.layerIndex);
        }
        if (widget.source && widget.source.id) {
          source = vis.analysis.findNodeById(widget.source.id);
          attrs.source = source;
        }

        newWidgetModel(attrs, layer, state);
      } else {
        cdb.log.error('No widget found for type ' + widget.type);
      }
    });

    dashboardView.render();

    var callbackObj = {
      dashboardView: dashboardView,
      widgets: widgetsService,
      areWidgetsInitialised: function () {
        var widgetsCollection = widgetsService.getCollection();
        if (widgetsCollection.size() > 0) {
          return widgetsCollection.hasInitialState();
        }
        return true;
      },
      vis: vis
    };

    vis.instantiateMap({
      success: function () {
        callback && callback(null, callbackObj);
      },
      error: function (errorMessage) {
        callback && callback(new Error(errorMessage), callbackObj);
      }
    });
  });
};

module.exports = function (selector, vizJSON, opts, callback) {
  var args = arguments;
  var fn = args[args.length - 1];

  if (_.isFunction(fn)) {
    callback = fn;
  }

  function _load (vizJSON) {
    createDashboard(selector, vizJSON, opts, function (error, dashboard) {
      var _dashboard = new Dashboard(dashboard);

      if (opts.share_urls) {
        _dashboard.onStateChanged(
          _.debounce(
            function (state, url) {
              window.history.replaceState('Object', 'Title', url);
            },
            500
          )
        );
      }

      callback && callback(error, _dashboard);
    });
  }

  if (typeof vizJSON === 'string') {
    cdb.core.Loader.get(vizJSON, function (data) {
      if (data) {
        _load(data, opts);
      } else {
        callback && callback(new Error('Error fetching viz.json file: ' + vizJSON));
      }
    });
  } else {
    _load(vizJSON, opts);
  }
};
