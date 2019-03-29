var WMSModel = require('builder/components/modals/add-basemap/wms/wms-model');
var ConfigModel = require('builder/data/config-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');

describe('editor/components/modals/add-basemap/wms/wms-model', function () {
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

    this.model = new WMSModel(null, {
      customBaselayersCollection: this.customBaselayersCollection
    });
  });

  it('should not have any layers initially', function () {
    expect(this.model.wmsLayersCollection.length).toEqual(0);
  });

  it('should have enter URl as initial view', function () {
    expect(this.model.get('currentView')).toEqual('enterURL');
  });

  describe('.fetchLayers', function () {
    beforeEach(function () {
      this.url = 'http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml';
      this.model.wmsLayersCollection.sync = function (a, b, opts) {
      };
      spyOn(this.model.wmsLayersCollection, 'fetch').and.callThrough();
      this.model.fetchLayers(this.url);
    });

    it('should fetch layers from given URL', function () {
      expect(this.model.wmsLayersCollection.fetch).toHaveBeenCalled();
      expect(this.model.wmsLayersCollection._wmsService._wms_url).toEqual(this.url);
    });

    it('should change view to indicate that layers are being fetched', function () {
      expect(this.model.get('currentView')).toEqual('fetchingLayers');
    });

    describe('when fetch is done', function () {
      describe('when there are layers', function () {
        beforeEach(function () {
          this.model.wmsLayersCollection.sync = function (a, b, opts) {
            opts.success({
              layers: [{}, {}, {}],
              title: 'title',
              type: 'type'
            });
          };
          this.model.fetchLayers(this.url);
        });

        it('should change view to select layer', function () {
          expect(this.model.get('currentView')).toEqual('selectLayer');
        });
      });

      describe('when there are no layer', function () {
        beforeEach(function () {
          this.model.wmsLayersCollection.sync = function (a, b, opts) {
            opts.success({
              layers: [],
              title: 'title',
              type: 'type'
            });
          };
          this.model.fetchLayers(this.url);
        });

        it('should change view back to enter URL', function () {
          expect(this.model.get('currentView')).toEqual('enterURL');
        });

        it('should indicate that layers were fetched', function () {
          expect(this.model.get('layersFetched')).toBeTruthy();
        });
      });
    });
  });

  describe('when a layer changes state', function () {
    beforeEach(function () {
      this.saveBasemapSpy = jasmine.createSpy('saveBasemap');
      this.model.bind('saveBasemap', this.saveBasemapSpy);
      this.model.wmsLayersCollection.reset([{}, {}, {}]);
    });

    it('should set the current view appropriately', function () {
      this.model.wmsLayersCollection.at(1).set('state', 'saving');
      expect(this.model.get('currentView')).toEqual('savingLayer');

      this.model.wmsLayersCollection.at(1).set('state', 'saveFail');
      expect(this.model.get('currentView')).toEqual('saveFail');
    });

    it('should select layer if state is done', function () {
      this.customBaselayerModel = {};

      this.model.wmsLayersCollection.at(1).set({
        state: 'saveDone',
        customBaselayerModel: this.customBaselayerModel
      });
      expect(this.saveBasemapSpy).toHaveBeenCalled();
      expect(this.model.get('layer')).toBe(this.customBaselayerModel);
    });
  });
});
