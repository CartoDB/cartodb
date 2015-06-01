var cdb = require('cartodb.js');
var MapboxViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/mapbox/mapbox_model.js');

describe('common/dialog/add_custom_basemap/mapbox/mapbox_view', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new MapboxViewModel();
    this.view = this.model.createView();
    this.view.render();
  });

  it('should render the inputs', function() {
    expect(this.view.$('input').length).toEqual(2);
  });

  describe('when click save', function() {
    beforeEach(function() {
      this.mapboxToTileLayerFactory = new cdb.admin.MapboxToTileLayerFactory({
        url: 'mapbox/URL',
        accessToken: 'abc123'
      });
      spyOn(this.mapboxToTileLayerFactory, 'createTileLayer');
      var self = this;
      spyOn(cdb.admin, 'MapboxToTileLayerFactory').and.callFake(function() {
        return self.mapboxToTileLayerFactory;
      });
      spyOn(this.model, 'save').and.callThrough();
      this.view.$('.js-url').val('mapbox/URL');
      this.view.$('.js-access-token').val('abc123');
      this.view.$('.js-ok').click();
    });

    it('should call save on model with current values', function() {
      expect(this.model.save).toHaveBeenCalled();
      expect(this.model.save).toHaveBeenCalledWith('mapbox/URL', 'abc123');
    });

    it('should show the loading message', function() {
      expect(this.innerHTML()).toContain('Validating');
      expect(this.view.$('input').length).toEqual(0);
    });

    describe('when layer is created', function() {
      beforeEach(function() {
        this.saveBasemapSpy = jasmine.createSpy('saveBasemap');
        this.model.bind('saveBasemap', this.saveBasemapSpy);
        this.tileLayer = jasmine.createSpy('cdb.admin.TileLayer');
        this.mapboxToTileLayerFactory.createTileLayer.calls.argsFor(0)[0].success(this.tileLayer);
      });

      it('should set the layer on the model', function() {
        expect(this.model.get('layer')).toBe(this.tileLayer);
      });

      it('should trigger saveBasemap event', function() {
        expect(this.saveBasemapSpy).toHaveBeenCalled();
      });
    });

    describe('when layer fails to be created', function() {
      beforeEach(function() {
        this.mapboxToTileLayerFactory.createTileLayer.calls.argsFor(0)[0].error('something failed');
      });

      it('should show the start view again', function() {
        expect(this.view.$('input').length).toEqual(2);
      });
    });
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
