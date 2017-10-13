var cdb = require('cartodb.js-v3');
var PublicMapWindow = require('../../../../javascripts/cartodb/public_map/public_map_window_static');
var vizdataJson = require('../../vizdata_sample.json');
var userdataJson = require('../../userdata_sample.json');
var vizjson = require('../../viz.json');

var CURRENT_USER = new cdb.admin.User(userdataJson.user_data);
var DATA = userdataJson;
var VIZDATA = vizdataJson;

var mapId = 'mapid';

describe('pubic_map/public_map_window_static', function() {
  beforeEach(function() {
    this.$el = $('<div id="app"></div>');

    cdb.config.set('user', CURRENT_USER);
    cdb.config.set('url_prefix', CURRENT_USER.get('base_url'));
    cdb.config.set('cartodb_com_hosted', true);
  });

  describe('initialize', function() {
    beforeEach(function () {
      this.view = new PublicMapWindow({
        el: this.$el,
        assetsVersion: '1.0.0',
        collection: new cdb.admin.Visualizations(),
        currentUser: CURRENT_USER,
        data: DATA,
        isMobileDevice: false,
        mapId: mapId,
        mapOptions: {},
        vizdata: VIZDATA
      });
    });

    it('should render', function () {
      expect(this.view.currentUser).toEqual(CURRENT_USER);
      expect(this.view.data).toEqual(DATA);
      expect(this.view.isHosted).toEqual(true);
      expect(this.view.mapId).toEqual(mapId);
      expect(this.view.disqusShortname).toEqual(userdataJson.user_data.disqus_shortname);
      expect(this.view.vizdata).toEqual(VIZDATA);
    });

    it('should create a vis on init', function () {
      spyOn(this.publicMapView, 'createVis');
      expect(this.pubicMapView.createVis).toHaveBeenCalled();
    });

    it('should invalidate the map o init', function () {
      spyOn(this.publicMapView, 'invalidateMap');
      expect(this.pubicMapView.invalidateMap).toHaveBeenCalled();
    });

    it('should invalidate the map o init', function () {
      spyOn(this.publicMapView, 'invalidateMap');
      expect(this.pubicMapView.invalidateMap).toHaveBeenCalled();
    });

    it('should have no leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });
});
