var WMSModel = require('../../../../../../../javascripts/cartodb3/components/modals/add-basemap/wms/wms-model');

describe('editor/components/modals/add-basemap/wms/wms-model', function () {
  beforeEach(function () {
    this.model = new WMSModel();
  });

  it('should not have any layers initially', function () {
    expect(this.model.layers.length).toEqual(0);
  });

  it('should have enter URl as initial view', function () {
    expect(this.model.get('currentView')).toEqual('enterURL');
  });

  describe('.fetchLayers', function () {
    beforeEach(function () {
      this.url = 'http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml';
      spyOn(this.model.layers, 'fetch');
      this.model.fetchLayers(this.url);
    });

    it('should fetch layers from given URL', function () {
      expect(this.model.layers.fetch).toHaveBeenCalled();
      expect(this.model.layers.fetch.calls.argsFor(0)[0]).toEqual(this.url);
      expect(this.model.layers.fetch.calls.argsFor(0)[1]).toEqual(jasmine.any(Function));
    });

    it('should change view to indicate that layers are being fetched', function () {
      expect(this.model.get('currentView')).toEqual('fetchingLayers');
    });

    describe('when fetch is done', function () {
      describe('when there are layers', function () {
        beforeEach(function () {
          this.model.layers.add({});
          this.model.layers.fetch.calls.argsFor(0)[1]();
        });

        it('should change view to select layer', function () {
          expect(this.model.get('currentView')).toEqual('selectLayer');
        });
      });

      describe('when there are no layer', function () {
        beforeEach(function () {
          this.model.layers.fetch.calls.argsFor(0)[1]();
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
      this.model.layers.reset([{}, {}, {}]);
    });

    it('should set the current view appropriately', function () {
      this.model.layers.at(1).set('state', 'saving');
      expect(this.model.get('currentView')).toEqual('savingLayer');

      this.model.layers.at(1).set('state', 'saveFail');
      expect(this.model.get('currentView')).toEqual('saveFail');
    });

    it('should select layer if state is done', function () {
      this.customBaselayerModel = {};

      this.model.layers.at(1).set({
        state: 'saveDone',
        customBaselayerModel: this.customBaselayerModel
      });
      expect(this.saveBasemapSpy).toHaveBeenCalled();
      expect(this.model.get('layer')).toBe(this.customBaselayerModel);
    });
  });
});
