var BasemapsModel = require('builder/editor/layers/basemap-content-views/basemap-model');

describe('editor/layers/basemap-content-views/basemap-model', function () {
  beforeEach(function () {
    this.model1 = new BasemapsModel({
      selected: true,
      val: 'positron_rainbow',
      label: 'Positron (labels below)',
      template: function () {
        return 'positron_rainbow';
      }
    });

    this.model2 = new BasemapsModel({
      selected: false,
      val: 'dark_matter_rainbow',
      label: '',
      template: function () {
        return 'dark_matter_rainbow';
      }
    });
  });

  describe('.getName', function () {
    it('should return label or value if empty', function () {
      expect(this.model1.get('label')).toBe('Positron (labels below)');
      expect(this.model1.get('label')).toBe(this.model1.getName());
      expect(this.model2.get('label')).toBe('');
      expect(this.model2.get('val')).toBe('dark_matter_rainbow');
      expect(this.model2.get('val')).toBe(this.model2.getName());
    });
  });

  describe('.getValue', function () {
    it('.getValue', function () {
      expect(this.model1.get('val')).toBe('positron_rainbow');
      expect(this.model1.getValue()).toBe(this.model1.get('val'));
    });
  });
});
