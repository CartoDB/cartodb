var BasemapsModel = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-model');

describe('editor/layers/basemap-content-views/basemap-model', function () {
  beforeEach(function () {
    this.model1 = new BasemapsModel({
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
    });

    this.model2 = new BasemapsModel({
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
      label: '',
      template: function () {
        return 'dark_matter_rainbow';
      }
    });
  });

  it('.getName', function () {
    expect(this.model1.get('label')).toBe('Positron (labels below)');
    expect(this.model1.get('label')).toBe(this.model1.getName());
    expect(this.model2.get('label')).toBe('');
    expect(this.model2.get('val')).toBe('dark_matter_rainbow');
    expect(this.model2.get('val')).toBe(this.model2.getName());
  });

  it('.getValue', function () {
    expect(this.model1.get('val')).toBe('positron_rainbow');
    expect(this.model1.getValue()).toBe(this.model1.get('val'));
  });
});
