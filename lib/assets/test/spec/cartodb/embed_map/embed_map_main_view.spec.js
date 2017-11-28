var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var EmbedMapView = require('../../../../javascripts/cartodb/embed_map/embed_map_main_view');
var vizdataJson = require('../../vizdata_sample.json');
var userdataJson = require('../../userdata_sample.json');
var vizjson = require('../../viz.json');

var CURRENT_USER = new cdb.admin.User(userdataJson.user_data);
var MAP_OWNER_USER = new cdb.admin.User(vizdataJson.permission.owner);
var DATA = userdataJson;
var VIZDATA = vizdataJson;

var mapId = 'mapid';
var mapViewTemplate = $('<div id="' + mapId + '"></div>');

document.body.appendChild(mapViewTemplate);

describe('embed_map/embed_map_main_view', function () {
  beforeEach(function () {
    this.view = new EmbedMapView({
      assetsVersion: 'wadus',
      data: DATA,
      mapId: mapId,
      vizdata: VIZDATA,
      password: 'wadus',
      mapOwnerUser: MAP_OWNER_USER,
      currentUser: CURRENT_USER
    });

    this.view.render();
  });

  it('should render', function () {
    expect(this.view.el).toBeDefined();
    expect(this.view.template).toBeDefined();
    expect(this.view.mapId).toEqual(mapId);
    expect(this.view.vizdata).toEqual(VIZDATA);
    expect(this.view.$('#' + mapId).length).toEqual(1);
    expect(this.view.$('.js-map').length).toEqual(1);
    expect(this.view.$('.js-spinner').length).toEqual(1);
  });

  it('should create a vis map', function (done) {
    spyOn(cdb, 'createVis')
      .and
      .callFake(function (el, vizurl, options, callback) {
        var vis = new cdb.vis.Vis({
          el: document.getElementById(el)
        });

        vis.load(vizjson, options);
        vis.done(callback);

        done();
        return vis;
      });

    this.view.createVis();
    expect(cdb.createVis).toHaveBeenCalled();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
