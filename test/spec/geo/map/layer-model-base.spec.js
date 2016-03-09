var LayerModelBase = require('../../../../src/geo/map/layer-model-base');

var MyLayer = LayerModelBase.extend({});

describe('geo/map/layer-model-base.js', function () {
  beforeEach(function () {
    this.layer = new MyLayer();
  });

  describe('.remove', function () {
    it('should trigger a destroy event', function () {
      var callback = jasmine.createSpy('callback');
      this.layer.bind('destroy', callback);

      this.layer.remove();

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('.update', function () {
    it('should set the attributes', function () {
      this.layer.update({
        a: 1,
        b: 2
      });

      expect(this.layer.get('a')).toEqual(1);
      expect(this.layer.get('b')).toEqual(2);
    });
  });

  describe('.show', function () {
    it('should set the visible attribute to true', function () {
      this.layer.set('visible', false);

      this.layer.show();

      expect(this.layer.get('visible')).toBeTruthy();
    });
  });

  describe('.hide', function () {
    it('should set the visible attribute to false', function () {
      this.layer.set('visible', true);

      this.layer.hide();

      expect(this.layer.get('visible')).toBeFalsy();
    });
  });

  describe('.toggle', function () {
    it('should toggel the visible attribute', function () {
      this.layer.set('visible', false);

      this.layer.toggle();

      expect(this.layer.get('visible')).toBeTruthy();

      this.layer.toggle();

      expect(this.layer.get('visible')).toBeFalsy();
    });
  });
});
