var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var MainView = require('../../../../javascripts/cartodb/show/main_view_static');

describe('show/main_view_static', function () {
  beforeEach(function () {
    var mapdata = _.clone(TestUtil.map_config);
    var basemaps = cdb.admin.DEFAULT_BASEMAPS;
    var user_data = TestUtil.user_data;
    var config = TestUtil.config;
    var baseLayers = new cdb.admin.UserLayers();
    var vizdata = TestUtil.createVis();
    var user = TestUtil.createUser();

    Backbone.History.started = true;

    this.$el = $('<div id="app"></div>');

    this.view = new MainView({
      el: this.$el,
      assetsVersion: '0.1.0',
      baseLayers: baseLayers,
      basemaps: basemaps,
      config: config,
      mapdata: mapdata,
      user: user,
      userData: user_data,
      vizdata: vizdata
    });
  });

  it('should render', function () {
    expect(this.view.$('.panes').length).toEqual(1);
    expect(_.size(this.view._subviews)).toEqual(2); // Table is not added to the view ¯\_(ツ)_/¯
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
