var $ = require('jquery');
var MapboxView = require('builder/components/modals/add-basemap/mapbox/mapbox-view');
var MapboxModel = require('builder/components/modals/add-basemap/mapbox/mapbox-model');
var MapboxToTileLayerFactory = require('builder/components/modals/add-basemap/mapbox/mapbox-to-tile-layer-factory');

describe('editor/components/modals/add-basemap/mapbox/mapbox-view', function () {
  beforeEach(function () {
    this.model = new MapboxModel();

    var submitButton = $('<button class="is-disabled">Submit</button>');
    var modalFooter = $('<div></div>');

    this.view = new MapboxView({
      model: this.model,
      submitButton: submitButton,
      modalFooter: modalFooter
    });
    this.view.render();
  });

  it('should render the inputs', function () {
    expect(this.view.$('input').length).toEqual(1);
  });

  describe('when click save', function () {
    beforeEach(function () {
      spyOn(MapboxToTileLayerFactory.prototype, 'createTileLayer');
      spyOn(this.model, 'validateInputs').and.callThrough();
      this.view.$('.js-url').val('mapbox/URL');
      this.view._submitButton.click();
    });

    it('should call validateInputs on model with current values', function () {
      expect(this.model.validateInputs).toHaveBeenCalled();
      expect(this.model.validateInputs).toHaveBeenCalledWith('mapbox/URL');
    });

    it('should show the loading message', function () {
      expect(this.innerHTML()).toContain('components.modals.add-basemap.validating');
      expect(this.view.$('input').length).toEqual(0);
    });

    describe('when layer is created', function () {
      beforeEach(function () {
        this.saveBasemapSpy = jasmine.createSpy('saveBasemap');
        this.model.bind('saveBasemap', this.saveBasemapSpy);
        this.tileLayer = jasmine.createSpy('CustomBaselayerModel');
        MapboxToTileLayerFactory.prototype.createTileLayer.calls.argsFor(0)[0].success(this.tileLayer);
      });

      it('should set the layer on the model', function () {
        expect(this.model.get('layer')).toBe(this.tileLayer);
      });

      it('should trigger saveBasemap event', function () {
        expect(this.saveBasemapSpy).toHaveBeenCalled();
      });
    });

    describe('when layer fails to be created', function () {
      beforeEach(function () {
        MapboxToTileLayerFactory.prototype.createTileLayer.calls.argsFor(0)[0].error('something failed');
      });

      it('should show the start view again', function () {
        expect(this.view.$('input').length).toEqual(1);
      });
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
