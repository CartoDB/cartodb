var CustomBaselayersCollection = require('../../../../javascripts/cartodb3/data/custom-baselayers-collection');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');

describe('data/custom-baselayers-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layers = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'http://a.example.com/basemap/6/30/24.png'
      }
    }, {
      id: 'basemap-id-2',
      options: {
        urlTemplate: 'http://b.example.com/basemap/6/30/24.png'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });
  });

  describe('.getSelected', function () {
    it('should return selected layer if any', function () {
      expect(this.layers.getSelected()).toBe(undefined);
      this.layers.at(0).set('selected', true);
      expect(this.layers.getSelected().get('id')).toBe('basemap-id-1');
    });
  });

  describe('.hasCustomBaseLayer', function () {
    it('should return layer with same classname if any', function () {
      expect(this.layers.hasCustomBaseLayer('httpcexamplecombasemap63024png')).toBe(false);
      expect(this.layers.hasCustomBaseLayer('httpaexamplecombasemap63024png')).toBe(true);
    });
  });
});
