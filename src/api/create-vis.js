var _ = require('underscore');
var DashboardView = require('cdb/geo/ui/dashboard-view');
var Model = require('cdb/core/model');
var Vis = require('cdb/vis/vis');
var WidgetsCollection = require('cdb/geo/ui/widgets/widgets_collection');

var createVis = function(el, vizjson, options, callback) {
  if (!el) {
    throw new TypeError("a DOM element should be provided");
  }

  var
  args = arguments,
  fn   = args[args.length -1];

  if (_.isFunction(fn)) {
    callback = fn;
  }

  el = (typeof el === 'string' ? document.getElementById(el) : el);

  // TODO keep this collection in sync with layers individual widgets collections
  var widgets = new WidgetsCollection();

  var dashboardInfoModel = new Model({
    title: vizjson.title,
    description: vizjson.description,
    updatedAt: vizjson.updated_at,
    userName: vizjson.user.fullname,
    userAvatarURL: vizjson.user.avatar_url
  });
  var dashboardView = new DashboardView({
    el: el,
    widgets: widgets,
    dashboardInfoModel: dashboardInfoModel
  });

  var vis = new Vis({
    el: dashboardView.$('#map'),
    dashboardView: dashboardView,
    widgets: widgets
  });

  if (vizjson) {
    vis.load(vizjson, options);

    if (callback) {
      vis.done(callback);
    }
  }

  return vis;
};

module.exports = createVis;
