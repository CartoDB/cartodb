var StyleDefinitionModel = require('../../../../../javascripts/cartodb3/editor/style/style-definition-model');

describe('editor/style/style-definition-model', function () {
  beforeEach(function () {
    this.model = new StyleDefinitionModel({
      type: 'simple',
      properties: {
        labels: {
          hello: 'hi'
        }
      }
    }, {
      parse: true
    });
  });

  describe('parse', function () {
    it('should flat properties attribute', function () {
      expect(this.model.get('labels')).toBeDefined();
      expect(this.model.get('properties')).not.toBeDefined();
    });
  });

  it('should init undo-manager', function () {
    expect(this.model._undoManager).toBeDefined();
  });

  describe('.setDefaultPropertiesByType', function () {
    it('should provide a way to set type default properties', function () {
      expect(this.model.get('type')).toBe('simple');
      var onChangeSpy = jasmine.createSpy('onChange');
      this.model.bind('change', onChangeSpy, this.model);
      this.model.setDefaultPropertiesByType('squares', 'points');
      expect(onChangeSpy).toHaveBeenCalled();
      expect(this.model.changed).toEqual({
        type: 'squares',
        fill: jasmine.any(Object),
        stroke: jasmine.any(Object),
        blending: 'none',
        aggregation: jasmine.any(Object),
        labels: jasmine.any(Object)
      });
    });
  });

  describe('.resetStyles', function () {
    it('should set styles to none', function () {
      expect(this.model.get('type')).toBe('simple');
      var onChangeSpy = jasmine.createSpy('onChange');
      this.model.bind('change', onChangeSpy, this.model);
      this.model.resetStyles();
      expect(onChangeSpy).toHaveBeenCalled();
      expect(this.model.changed).toEqual({
        type: 'none',
        fill: null,
        stroke: null,
        blending: null,
        aggregation: jasmine.any(Object),
        labels: jasmine.any(Object)
      });
    });
  });

  describe('toJSON', function () {
    it('should unflat attributes', function () {
      this.model.set('fill', {
        size: {
          fixed: 10
        }
      });

      var data = this.model.toJSON();
      expect(data.type).toBe('simple');
      expect(data.properties).toBeDefined();
      expect(data.properties).toEqual({
        labels: jasmine.any(Object),
        fill: jasmine.any(Object)
      });
      expect(data.fill).not.toBeDefined();
    });
  });
});
