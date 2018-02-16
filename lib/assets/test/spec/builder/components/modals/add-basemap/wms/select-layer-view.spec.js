var WMSModel = require('builder/components/modals/add-basemap/wms/wms-model');
var ConfigModel = require('builder/data/config-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');
var SelectLayerView = require('builder/components/modals/add-basemap/wms/select-layer-view');

describe('editor/components/modals/add-basemap/wms/select-layer-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'https://a.example.com/{z}/{x}/{y}.png',
        category: 'Custom',
        className: 'httpsaexamplecomzxypng'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.layer = new CustomBaselayerModel({
      id: 'basemap-id-2',
      urlTemplate: 'https://a.example.com/{z}/{x}/{y}.png',
      attribution: null,
      maxZoom: 21,
      minZoom: 0,
      className: 'httpsaexamplecomzxypng',
      name: 'item #2',
      tms: false,
      category: 'WMS',
      type: 'Tiled'
    });

    this.customBaselayersCollection.add(this.layer);

    this.model = new WMSModel(null, {
      customBaselayersCollection: this.customBaselayersCollection
    });

    this.view = new SelectLayerView({
      model: this.model,
      customBaselayersCollection: this.customBaselayersCollection
    });
    this.view.render();
  });

  describe('when there are a bunch of layers and some unavailable ones', function () {
    beforeEach(function () {
      this.model.wmsLayersCollection.reset([{
        title: 'item #1'
      }, {
        title: 'item #2'
      }, {
        title: 'item #3'
      }, {
        title: 'item #4'
      }]);
      this.view.render();
    });

    it('should render the amount of layers', function () {
      expect(this.model.getLayers().length).toBe(4);
      expect(this.model.layersAvailableCount()).toBe(3);

      expect(this.innerHTML()).toContain('components.modals.add-basemap.wms.placeholder');
    });

    it('should render the individual items', function () {
      expect(this.innerHTML()).toContain('item #1');
      expect(this.innerHTML()).toContain('item #4');
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when click back', function () {
    beforeEach(function () {
      this.view.$('.js-back').click();
    });

    it('should set current view to go back to enter URL', function () {
      expect(this.model.get('currentView')).toEqual('enterURL');
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
