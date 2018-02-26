var Backbone = require('backbone');
var InputRampContentView = require('builder/components/form-components/editors/fill/input-color/input-quantitative-ramps/input-ramp-content-view');

describe('components/form-components/editors/fill/input-color/input-quantitative-ramps/input-ramp-content-view', function () {
  function createView (opacity) {
    this.model = new Backbone.Model({
      range: ['#c0ffee', '#bada55', '#decade'],
      opacity: opacity
    });
    return new InputRampContentView({ model: this.model });
  }

  describe('._createColorPickerView', function () {
    it('should return picker view with default opacity if no one is provided', function () {
      var view = createView();
      var pickerView = view._createColorPickerView();

      expect(pickerView.model.get('opacity')).toEqual(1);
      view.remove();
    });

    it('should return picker view with the provided opacity', function () {
      var view = createView(0.43);
      var pickerView = view._createColorPickerView();

      expect(pickerView.model.get('opacity')).toEqual(0.43);
      view.remove();
    });

    it('should update own opacity when picker view updates its', function () {
      var view = createView(0.43);
      var pickerView = view._createColorPickerView();

      pickerView.model.set('opacity', 0.84);

      expect(view.model.get('opacity')).toEqual(0.84);
      view.remove();
    });

    it('should not have leaks', function () {
      var view = createView(0.43);
      expect(view).toHaveNoLeaks();
      view.remove();
    });
  });
});
