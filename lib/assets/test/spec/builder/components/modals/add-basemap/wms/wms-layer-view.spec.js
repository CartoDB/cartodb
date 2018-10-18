var LayerView = require('builder/components/modals/add-basemap/wms/wms-layer-view');
var LayerModel = require('builder/components/modals/add-basemap/wms/wms-layer-model');
var ConfigModel = require('builder/data/config-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');
var WMSService = require('builder/data/wms-service');

describe('editor/components/modals/add-basemap/wms/wms-layer-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.wmsService = new WMSService();

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

    this.model = new LayerModel(null, {
      wmsService: this.wmsService
    });

    this.view = new LayerView({
      model: this.model,
      customBaselayersCollection: this.customBaselayersCollection
    });

    this.view.render();
  });

  it('should render item title or name', function () {
    this.model.set('name', 'Roads');
    this.view.render();
    expect(this.innerHTML()).toContain('Roads');
    this.model.set('title', 'Title has prio');
    this.view.render();
    expect(this.innerHTML()).toContain('Title has prio');
  });

  it('should not disable any item by default', function () {
    expect(this.innerHTML).not.toContain('is-disabled');
  });

  describe('when can not save layer', function () {
    beforeEach(function () {
      this.model.set('title', 'Test');

      this.layer = new CustomBaselayerModel({
        id: 'basemap-id-2',
        urlTemplate: 'https://a.example.com/{z}/{x}/{y}.png',
        attribution: null,
        maxZoom: 21,
        minZoom: 0,
        className: 'httpsaexamplecomzxypng',
        name: 'Test',
        tms: false,
        category: 'WMS',
        type: 'Tiled'
      });

      this.customBaselayersCollection.add(this.layer);
      this.view.render();
    });

    it('should disable item', function () {
      expect(this.innerHTML()).toContain('is-disabled');
    });
  });

  describe('when clicking add this', function () {
    beforeEach(function () {
      spyOn(this.model, 'createProxiedLayerOrCustomBaselayerModel');
      spyOn(this.model, 'canSave');
    });

    it('should call save on model only if can save', function () {
      this.model.canSave.and.returnValue(false);
      this.view.$('.js-add').click();
      expect(this.model.createProxiedLayerOrCustomBaselayerModel).not.toHaveBeenCalled();

      this.model.canSave.and.returnValue(true);
      this.view.$('.js-add').click();
      expect(this.model.createProxiedLayerOrCustomBaselayerModel).toHaveBeenCalled();
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
