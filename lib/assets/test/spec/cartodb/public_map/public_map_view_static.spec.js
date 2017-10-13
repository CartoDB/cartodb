var cdb = require('cartodb.js-v3');
var PublicMapView = require('../../../../javascripts/cartodb/public_map/public_map_view_static');
var vizdataJson = require('../../vizdata_sample.json');
var userdataJson = require('../../userdata_sample.json');
var vizjson = require('../../viz.json');

var CURRENT_USER = new cdb.admin.User(userdataJson.user_data);
var DATA = userdataJson;
var VIZDATA = vizdataJson;

var mapId = 'mapid';

describe('pubic_map/public_map_view_static', function() {
  beforeEach(function() {
    this.view = new PublicMapView({
      mapId: mapId,
      currentUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA
    });

    this.view.render();
  });

  it('should render', function() {
    expect(this.view.el).toBeDefined();
    expect(this.view.template).toBeDefined();
    expect(this.view.mapId).toEqual(mapId);
    expect(this.view.vizdata).toEqual(VIZDATA);
    expect(this.view.$('#' + mapId).length).toEqual(1);
    expect(this.view.$('.js-map').length).toEqual(1);
    expect(this.view.$('.js-spinner').length).toEqual(1);
  });

  it('should create a vis map', function() {
    spyOn(cdb, 'createVis')
      .and
      .callFake(function(el, vizurl, options, callback) {
        var vis = new cartodb.vis.Vis({
          el: document.getElementById(el)
        });

        vis.load(vizjson, options);
        vis.done(callback);

        return vis;
      });

    this.view.createVis();
    expect(cdb.createVis).toHaveBeenCalled();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
