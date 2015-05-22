var WMSViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/wms_model.js');

describe('common/dialog/add_custom_basemap/wms/wms_model', function() {
  beforeEach(function() {
    this.model = new WMSViewModel({
    });
  });

  it('should not have any layers initially', function() {
    expect(this.model.get('layers').length).toEqual(0);
  });

  it('should have enter URl as initial view', function() {
    expect(this.model.get('currentView')).toEqual('enterUrl');
  });

  describe('.fetchLayers', function() {
    beforeEach(function() {
      this.url = 'http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml';
      spyOn(this.model.get('layers'), 'fetch');
      this.model.fetchLayers(this.url);
    });

    it('should fetch layers from given URL', function() {
      expect(this.model.get('layers').fetch).toHaveBeenCalled();
      expect(this.model.get('layers').fetch.calls.argsFor(0)[0]).toEqual(this.url);
      expect(this.model.get('layers').fetch.calls.argsFor(0)[1]).toEqual(jasmine.any(Function));
    });

    it('should change view to indicate that layers are being fetched', function() {
      expect(this.model.get('currentView')).toEqual('fetchingLayers');
    });

    describe('when fetch is done', function() {
      describe('when there are layers', function() {
        beforeEach(function() {
          this.model.get('layers').add({});
          this.model.get('layers').fetch.calls.argsFor(0)[1]();
        });

        it('should change view to select layer', function() {
          expect(this.model.get('currentView')).toEqual('selectLayer');
        });
      });

      describe('when there are no layer', function() {
        beforeEach(function() {
          this.model.get('layers').fetch.calls.argsFor(0)[1]();
        });

        it('should change view back to enter URL', function() {
          expect(this.model.get('currentView')).toEqual('enterUrl');
        });

        it('should indicate that layers were fetched', function() {
          expect(this.model.get('layersFetched')).toBeTruthy();
        });
      });
    });
  });

  describe('when a layer changes state', function() {
    beforeEach(function() {
      this.saveBasemapSpy = jasmine.createSpy('saveBasemap');
      this.model.bind('saveBasemap', this.saveBasemapSpy);
      this.model.get('layers').reset([{},{},{}]);
    });

    it('should set the current view appropriately', function() {
      this.model.get('layers').at(1).set('state', 'saving');
      expect(this.model.get('currentView')).toEqual('savingLayer');

      this.model.get('layers').at(1).set('state', 'saveFail');
      expect(this.model.get('currentView')).toEqual('saveFail');
    });

    it('should select layer if state is done', function() {
      this.tileLayer = {};
      this.model.get('layers').at(1).set({
        state: 'saveDone',
        tileLayer: this.tileLayer
      });
      expect(this.saveBasemapSpy).toHaveBeenCalled();
      expect(this.model.get('layer')).toBe(this.tileLayer);
    });
  });
});
