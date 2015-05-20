var SelectLayerView = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/select_layer_view.js');
var WMSViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/wms_model.js');

describe('common/dialog/add_custom_basemap/wms/select_layer_view', function() {
  beforeEach(function() {
    this.model = new WMSViewModel({
    });
    this.view = new SelectLayerView({
      model: this.model
    });
    this.view.render();
  });

  describe('when there are a bunch of layers and some unavailable ones', function() {
    beforeEach(function() {
      var raw = [{"llbbox":[-71.63,41.75,-70.78,42.9],"name":"ROADS_RIVERS","srs":["EPSG:26986"],"title":"Roads and Rivers"},{"llbbox":[-71.63,41.75,-70.78,42.9],"name":"ROADS_1M","srs":["EPSG:26986"],"title":"Roads at 1:1M scale"},{"llbbox":[-71.63,41.75,-70.78,42.9],"name":"RIVERS_1M","srs":["EPSG:26986"],"title":"Rivers at 1:1M scale"},{"llbbox":[-180,-90,180,90],"name":"Clouds","srs":[],"title":"Forecast cloud cover"},{"llbbox":[-180,-90,180,90],"name":"Temperature","srs":[],"title":"Forecast temperature"},{"llbbox":[-180,-90,180,90],"name":"Pressure","srs":[],"title":"Forecast barometric pressure"},{"llbbox":[-180,-90,180,90],"name":"ozone_image","srs":[],"title":"Global ozone distribution (1992)"},{"llbbox":[-180,-90,180,90],"name":"population","srs":[],"title":"World population, annual"}]
      this.model.get('layers').reset([{
        name: 'item #1'
      }, {
        name: 'item #2'
      }, {
        name: 'item #3'
      }, {
        name: 'item #4'
      }]);
      this.view.render();
    });

    it('should render the amount of found vs. available layers', function() {
      expect(this.innerHTML()).toContain('layers found');
      expect(this.innerHTML()).toContain('layers available');
    });

    it('should render the individual items', function() {
      expect(this.innerHTML()).toContain('item #1');
      expect(this.innerHTML()).toContain('item #4');
    });

    it('should not have any leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
