var _ = require('underscore');
var $ = require('jquery');
var ConfigModel = require('builder/data/config-model');
var TileJSONModel = require('builder/components/modals/add-basemap/tilejson/tilejson-model');
var TileJSONView = require('builder/components/modals/add-basemap/tilejson/tilejson-view');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');
var TileJSONLayerModel = require('builder/components/modals/add-basemap/tilejson/tilejson-layer-model');

describe('components/modals/add-basemap/tilejson/tilejson-view', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'https://a.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
        category: 'TileJSON',
        className: 'httpsatilesmapboxcomv3mapboxgeographyclasszxypng'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new TileJSONModel(null, {
      customBaselayersCollection: this.customBaselayersCollection
    });

    var submitButton = $('<button class="is-disabled">Submit</button>');
    var tileJSONLayerModel = new TileJSONLayerModel();

    this.view = new TileJSONView({
      model: this.model,
      customBaselayersCollection: this.customBaselayersCollection,
      submitButton: submitButton,
      tileJSONLayerModel: tileJSONLayerModel
    });
    this.view.render();
  });

  it('should render the set button as disabled initially', function () {
    expect(this.view._submitButton.hasClass('is-disabled')).toBe(true);
  });

  describe('when user written a URL', function () {
    describe('when URL is half-done or invalid', function () {
      beforeEach(function () {
        spyOn($, 'ajax');

        this.view.$('.js-url')
          .val('ht')
          .trigger('keydown');
      });

      it('should indicate that it is validating URL', function () {
        expect(this.innerHTML()).toMatch('js-validating.*display: inline');
      });

      describe('when triggers error', function () {
        beforeEach(function () {
          $.ajax.calls.argsFor(0)[0].error();
        });

        it('should show error', function () {
          expect(this.view.$('.js-error').attr('class')).toContain('is-visible');
          expect(this.innerHTML()).toContain('components.modals.add-basemap.tilejson.invalid');
        });

        it('should not indicate validating anymore', function () {
          expect(this.innerHTML()).not.toMatch('js-validating.*display: inline');
        });

        it('should disable OK button', function () {
          expect(this.view._submitButton.hasClass('is-disabled')).toBe(true);
        });
      });

      describe('when finally written/pasted a valid URL', function () {
        beforeEach(function () {
          this.layer = new CustomBaselayerModel({
            id: 'basemap-id-2',
            urlTemplate: 'https://b.tiles.mapbox.com/v3/mapbox.geography-class/{z}/{x}/{y}.png',
            attribution: null,
            maxZoom: 21,
            minZoom: 0,
            className: 'httpsbtilesmapboxcomv3mapboxgeographyclasszxypng',
            name: 'Geography Class',
            tms: false,
            category: 'TileJSON',
            type: 'Tiled'
          });

          spyOn(this.view._tileJSONLayerModel, 'newTileLayer').and.returnValue(this.layer);

          $.ajax.calls.argsFor(0)[0].success();
        });

        it('should create layer with url', function () {
          expect(this.model.get('layer')).toBe(this.layer);
        });

        it('should enable save button', function () {
          expect(this.view.$('.js-ok').attr('class')).not.toContain('is-disabled');
        });

        it('should hide error', function () {
          expect(this.view.$('.js-error').attr('class')).not.toContain('is-visible');
        });
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
