const Backbone = require('backbone');
const L = require('leaflet');
const $ = require('jquery');
const HeaderView = require('dashboard/views/data-library/header/header-view');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/data-library/header/header-view', function () {
  let view, collection, model;

  const createViewFn = function (options) {
    collection = new Backbone.Collection({});
    collection.options = new Backbone.Model({
      page: 5,
      tags: ['rick', 'morty'],
      q: '',
      type: 'map'
    });

    model = new Backbone.Model({
      show_countries: false
    });

    spyOn(L, 'geoJson').and.callThrough();

    const viewOptions = Object.assign({}, { collection, model, configModel }, options);
    const view = new HeaderView(viewOptions);

    return view;
  };

  afterEach(function () {
    view && view.clean();
  });

  it('throws an error when configModel is missing', function () {
    const viewFactory = function () {
      return createViewFn({
        configModel: undefined
      });
    };

    expect(viewFactory).toThrowError('configModel is required');
  });

  describe('.load', function () {
    let responseData = { type: 'FeatureCollection', features: [] };

    beforeEach(function () {
      view = createViewFn();
      view.render();

      const done = callback => callback(responseData);
      spyOn(view, '_addGeojsonData');
      spyOn($, 'getJSON').and.returnValue({ done });

      view.load();
    });

    it('should create a leaflet map', function () {
      expect(view.map).toBeDefined();
      expect(view.map.options.zoomControl).toBe(false);
      expect(view.map.options.attributionControl).toBe(false);
      expect(view.map.getZoom()).toBe(3);
      expect(view.map.getCenter().lat).toBe(44);
      expect(view.map.getCenter().lng).toBe(-31);
    });

    it('should get a geojson', function () {
      const url = 'http://rick.wadus.com/api/v2/sql?q=select%20*%20from%20world_borders&format=geojson&filename=world_borders';

      expect($.getJSON).toHaveBeenCalledWith(url);
    });

    it('should call _addGeojsonData', function () {
      expect(view._addGeojsonData).toHaveBeenCalledWith(responseData);
    });
  });

  describe('._addGeojsonData', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
      view.load();
    });

    it('should set the geoJson in leaflet', function () {
      const data = { type: 'FeatureCollection', features: [] };
      const style = {
        color: '#2E3C43',
        weight: 1,
        opacity: 1,
        fillColor: '#242D32',
        fillOpacity: 1
      };

      view._addGeojsonData(data);

      expect(L.geoJson).toHaveBeenCalledWith(data, { style });
    });
  });
});
