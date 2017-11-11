var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var PublicMapWindow = require('../../../../javascripts/cartodb/public_map/public_map_window_static');
var vizdataJson = require('../../vizdata_sample.json');
var userdataJson = require('../../userdata_sample.json');
var vizjson = require('../../viz.json');
var visualizationsJson = require('../../visualizations_sample.json');

var CURRENT_USER = new cdb.admin.User(userdataJson.user_data);
var MAP_OWNER_USER = new cdb.admin.User(vizdataJson.permission.owner);
var VISUALIZATIONS = visualizationsJson;
var DATA = userdataJson;
var VIZDATA = vizdataJson;

var MAP_ID = 'mapid';

describe('pubic_map/public_map_window_static', function () {
  beforeEach(function () {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(new RegExp(/api\/v1\/user/))
      .andReturn({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        responseText: JSON.stringify(vizjson)
      });

    this.$el = $('<div id="app"></div>');

    cdb.config.set(DATA.config);
    cdb.config.set('user', CURRENT_USER);
    cdb.config.set('url_prefix', CURRENT_USER.get('base_url'));
    cdb.config.set('cartodb_com_hosted', true);
    cdb.templates.namespace = 'cartodb/';

    this.view = new PublicMapWindow({
      el: this.$el,
      assetsVersion: '1.0.0',
      collection: new cdb.admin.Visualizations(),
      currentUser: CURRENT_USER,
      data: DATA,
      isMobileDevice: false,
      mapId: MAP_ID,
      mapOptions: {},
      mapOwnerUser: MAP_OWNER_USER,
      visualizations: VISUALIZATIONS,
      vizdata: VIZDATA
    });
    this.view.render();

    spyOn(this.view.publicMapView, 'createVis');
    spyOn(this.view.publicMapView, 'invalidateMap');
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should render', function () {
    expect(this.view.currentUser).toEqual(CURRENT_USER);
    expect(this.view.data).toEqual(DATA);
    expect(this.view.isHosted).toEqual(true);
    expect(this.view.mapId).toEqual(MAP_ID);
    expect(this.view.disqusShortname).toEqual(userdataJson.user_data.disqus_shortname);
    expect(this.view.vizdata).toEqual(VIZDATA);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
