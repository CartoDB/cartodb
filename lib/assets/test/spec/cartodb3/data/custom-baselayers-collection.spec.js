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

  describe('.updateSelected', function () {
    it("should not update selected layer if it doesn't exist", function () {
      expect(this.layers.at(0).get('selected')).toBe(undefined);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
      this.layers.updateSelected('basemap-id-3');
      expect(this.layers.at(0).get('selected')).toBe(undefined);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
    });

    it('should update selected layer if it exists', function () {
      expect(this.layers.at(0).get('selected')).toBe(undefined);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
      this.layers.updateSelected('basemap-id-1');
      expect(this.layers.at(0).get('selected')).toBe(true);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
    });

    it('should unselect the previous if it exists', function () {
      expect(this.layers.at(0).get('selected')).toBe(undefined);
      expect(this.layers.at(1).get('selected')).toBe(undefined);
      this.layers.updateSelected('basemap-id-1');
      this.layers.updateSelected('basemap-id-2');
      expect(this.layers.at(0).get('selected')).toBe(false);
      expect(this.layers.at(1).get('selected')).toBe(true);
    });
  });
});
