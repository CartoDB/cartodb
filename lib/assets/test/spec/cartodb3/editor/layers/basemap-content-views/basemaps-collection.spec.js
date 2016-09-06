var BasemapsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemaps-collection');

describe('editor/layers/basemap-content-views/basemaps-collection', function () {
  beforeEach(function () {
    this.collection = new BasemapsCollection([{
      default: true,
      url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Positron (labels below)',
      className: 'positron_rainbow',
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      category: 'CARTO',
      selected: true,
      val: 'positron_rainbow',
      label: 'Positron (labels below)',
      template: function () {
        return 'positron_rainbow';
      }
    }, {
      default: false,
      url: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Dark matter (labels below)',
      className: 'dark_matter_rainbow',
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      category: 'CARTO',
      selected: false,
      val: 'dark_matter_rainbow',
      label: 'Dark matter (labels below)',
      template: function () {
        return 'dark_matter_rainbow';
      }
    }, {
      default: false,
      url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png',
      subdomains: 'abcd',
      minZoom: '0',
      maxZoom: '18',
      name: 'Watercolor',
      className: 'watercolor_stamen',
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
      category: 'Stamen',
      selected: false,
      val: 'watercolor_stamen',
      label: 'Watercolor',
      template: function () {
        return 'watercolor_stamen';
      }
    }, {
      default: false,
      url: '://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token=A7tBPacePg9Mj_zghvKt9Q&app_id=KuYppsdXZznpffJsKT24',
      subdomains: '1234',
      minZoom: '0',
      maxZoom: '20',
      name: 'Nokia Day',
      className: 'nokia_day',
      attribution: 'Map&copy;2016 HERE <a href="http://here.net/services/terms" target="_blank">Terms of use</a>',
      category: 'Here',
      selected: false,
      val: 'nokia_day',
      label: 'Nokia Day',
      template: function () {
        return 'nokia_day';
      }
    }, {
      default: false,
      color: '#ff6600',
      image: '',
      maxZoom: 32,
      className: 'plain',
      category: 'Color',
      type: 'Plain',
      selected: false,
      val: 'plain',
      label: 'plain',
      template: function () {
        return 'plain';
      }
    }]);

    this.collection.add({
      options: {
        visible: true,
        type: 'Tiled',
        urlTemplate: 'https://a.tiles.mapbox.com/v4/aj.um7z9lus/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpbG10dnA3NzY3OTZ0dmtwejN2ZnUycjYifQ.1W5oTOnWXQ9R1w8u3Oo1yA',
        attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a> <a class="mapbox-improve-map" href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>',
        maxZoom: 21,
        minZoom: 0,
        name: 'MapBox Streets Outdoors Global Preview',
        order: 26
      },
      kind: 'tiled',
      infowindow: null,
      tooltip: null,
      id: 'basemap-id-1',
      order: 26
    });

    this.collection.add({
      id: 'basemap-id-2',
      infowindow: null,
      kind: 'tiled',
      options: {
        attribution: null,
        className: 'httpsstamentilessasslfastlynetwatercolorzxyjpg',
        maxZoom: 21,
        minZoom: 0,
        name: 'Custom basemap 29',
        order: 29,
        tms: false,
        type: 'Tiled',
        urlTemplate: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
        visible: true
      },
      order: 29,
      tooltip: null
    });
  });

  it('should have only one selected', function () {
    var l0 = this.collection.at(0);
    var l1 = this.collection.at(1);

    expect(l0.get('selected')).toBeTruthy();
    expect(this.collection.where({ selected: true }).length).toBe(1);
    l1.set('selected', true);
    expect(this.collection.where({ selected: true }).length).toBe(1);
    expect(l0.get('selected')).toBeFalsy();
    expect(l1.get('selected')).toBeTruthy();
  });

  describe('.getSelected', function () {
    it('should return selected model', function () {
      var l0 = this.collection.at(0);
      var selected = this.collection.getSelected();

      expect(l0.get('selected')).toBeTruthy();
      expect(selected.get('selected')).toBeTruthy();
      expect(l0.get('className')).toBe(selected.get('className'));
    });
  });

  describe('.findByCategory', function () {
    it('should return models for that category', function () {
      expect(this.collection.findByCategory('CARTO').length).toBe(2);
    });
  });

  describe('.getDefaultCategory', function () {
    it('should return default category', function () {
      expect(this.collection.getDefaultCategory()).toBe('CARTO');
    });
  });

  describe('.getCategories', function () {
    it('should return an array of categories', function () {
      expect(this.collection.getCategories().length).toBe(6); // CARTO, Here, Stamen, Color, Custom, Mapbox
    });
  });

  describe('.updateSelected', function () {
    it('should update selected passing the classname', function () {
      var l0 = this.collection.at(0);
      var l1 = this.collection.at(1);

      expect(l0.get('className')).toBe('positron_rainbow');
      expect(l0.get('selected')).toBeTruthy();
      expect(l1.get('selected')).toBeFalsy();
      this.collection.updateSelected('dark_matter_rainbow');
      expect(l1.get('className')).toBe('dark_matter_rainbow');
      expect(l0.get('selected')).toBeFalsy();
      expect(l1).toBeTruthy();
    });
  });

  describe('.getByValue', function () {
    it('should return model by value', function () {
      var l0 = this.collection.at(0);
      var l1 = this.collection.getByValue('positron_rainbow');

      expect(l0.get('className')).toBe(l1.get('className'));
    });
  });
});
