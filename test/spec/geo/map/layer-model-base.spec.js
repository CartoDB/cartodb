var LayerModelBase = require('../../../../src/geo/map/layer-model-base');

var MyLayer = LayerModelBase.extend({});

describe('geo/map/layer-model-base.js', function () {
  beforeEach(function () {
    this.layer = new MyLayer();
  });

  describe('.remove', function () {
    it('should trigger a destroy event with options', function () {
      var callback = jasmine.createSpy('callback');
      var collection = {};
      var option = { option: 'one' };

      this.layer.bind('destroy', callback);
      this.layer.collection = collection;
      this.layer.remove(option);

      expect(callback).toHaveBeenCalledWith(this.layer, this.layer.collection, option);
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

  describe('.setOk', function () {
    it('should unset error attribute', function () {
      this.layer.set('error', 'error');
      this.layer.setOk();
      expect(this.layer.get('error')).toBeUndefined();
    });
  });

  describe('.setError', function () {
    it('should set error attribute', function () {
      this.layer.setError('wadus');

      expect(this.layer.get('error')).toEqual('wadus');
    });
  });
});
