var $ = require('jquery');
var DatePickerRangeView = require('builder/components/date-picker-range/date-picker-range-view');

describe('components/date-picker-range/date-picker-range-view', function () {
  beforeEach(function () {
    this.view = new DatePickerRangeView({el: $('<div></div>')});
    this.view.render();

    this.isDisabled = function () {
      return this.view.$('button.DatePicker-dates').prop('disabled');
    }.bind(this);
  });

  it('should render properly', function () {
    expect(this.view.$('button.DatePicker-dates').length).toBe(1);
  });

  it('should be enabled by default', function () {
    expect(this.isDisabled()).toBe(false);
  });

  it('can be explicitly disabled', function () {
    this.view = new DatePickerRangeView({el: $('<div></div>'), disabled: true});
    this.view.render();
    expect(this.isDisabled()).toBe(true);

    this.view = new DatePickerRangeView({el: $('<div></div>'), disabled: false});
    this.view.render();
    expect(this.isDisabled()).toBe(false);
  });
});
