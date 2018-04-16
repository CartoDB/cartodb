var $ = require('jquery');
var _ = require('underscore');
var DatePickerRangeView = require('builder/components/date-picker-range/date-picker-range-view');

describe('components/date-picker-range/date-picker-range-view', function () {
  beforeEach(function () {
    this.createView = function (opts) {
      var custom = opts || {};
      var defaults = {el: $('<div></div>')};
      return new DatePickerRangeView(_.extend(defaults, custom));
    };
    this.view = this.createView();
  });

  it('should be enabled by default', function () {
    expect(this.view.model.get('disabled')).toBe(false);
  });

  it('can be created disabled or enabled', function () {
    var v = this.createView({disabled: true});
    expect(v.model.get('disabled')).toBe(true);

    v = this.createView({disabled: false});
    expect(v.model.get('disabled')).toBe(false);
  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('button.DatePicker-dates').length).toBe(1);
    });

    it('can be rendered disabled or enabled', function () {
      expect(this.view.model.get('disabled')).toBe(false);
      expect(this.view.$('button.DatePicker-dates').prop('disabled')).toBe(false);

      this.view.model.set('disabled', true);
      this.view.render();
      expect(this.view.$('button.DatePicker-dates').prop('disabled')).toBe(true);
    });
  });
});
