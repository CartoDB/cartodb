var cdb = require('cartodb.js-v3');
var PublicMapView = require('../../../../javascripts/cartodb/public_map/public_map_view_static');

var DATA = TestUtil.user_data;
var CURRENT_USER = new TestUtil.createUser();
var VIZDATA = TestUtil.createVis();

var mapId = 'mapid';
var mapViewTemplate = $('<div id="'+ mapId +'"></div>');

document.body.appendChild(mapViewTemplate);

describe('pubic_map/public_map_view_static', function () {
  beforeEach(function () {
    this.view = new PublicMapView({
      data: DATA,
      mapId: mapId,
      isInsideOrg: false,
      vizdata: VIZDATA,
      password: '1345'
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
