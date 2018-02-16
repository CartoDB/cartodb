var InputColorPickerView = require('builder/components/form-components/editors/fill/input-color/input-color-picker/input-color-picker-view');

describe('components/form-components/editors/fill/input-color/input-color-picker/input-color-picker-view', function () {
  beforeEach(function () {
    this.view = new InputColorPickerView({ ramp: [ 303 ], opacity: 0.81 });
  });

  afterEach(function () {
    this.view.remove();
  });

  describe('initialization', function () {
    it('should throw Error if no ramp provided', function () {
      var wrapper = function () {
        new InputColorPickerView({}); // eslint-disable-line no-new
      };

      expect(wrapper).toThrowError('ramp is required');
    });

    it('should throw Error if no opacity provided', function () {
      var wrapper = function () {
        new InputColorPickerView({ ramp: [] }); // eslint-disable-line no-new
      };

      expect(wrapper).toThrowError('opacity is required');
    });

    it('should create proper model and bindings', function () {
      var view = new InputColorPickerView({ ramp: [ 303 ], opacity: 0.81 });

      expect(view.model.get('ramp')).toEqual([ 303 ]);
      expect(view.model.get('opacity')).toEqual(0.81);
    });

    it('should have bindings for changes in model', function () {
      var view = new InputColorPickerView({ ramp: [ 303 ], opacity: 0.81 });
      expect(view.model._events['change:index'][0].callback).toEqual(jasmine.anything());
      expect(view.model._events['change:opacity'][0].callback).toEqual(jasmine.anything());
    });
  });

  describe('._onOpacityChanged', function () {
    it('should trigger change:opacity when opacity changes', function () {
      var view = new InputColorPickerView({ ramp: [ 303 ], opacity: 0.81 });
      var opacity = 0;
      function onOpacityChanged (value) {
        opacity = value;
      }
      view.bind('change:opacity', onOpacityChanged);

      view.model.set('opacity', 0.5);

      expect(opacity).toBe(0.5);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
