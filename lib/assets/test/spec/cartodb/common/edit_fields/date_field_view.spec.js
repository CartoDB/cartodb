var cdb = require('cartodb.js-v3');
var EditFieldModel = require('../../../../../javascripts/cartodb/common/edit_fields/edit_field_model');
var DateFieldView = require('../../../../../javascripts/cartodb/common/edit_fields/date_field/date_field_view');
var moment = require('moment');

describe('common/edit_fields/date_field', function() {

  beforeEach(function() {
    this.model = new EditFieldModel({
      type: 'date',
      attribute: 'date_column',
      value: '2015-10-10T10:10:10Z'
    })
    this.view = new DateFieldView({
      model: this.model,
      showTime: false
    });
    this.view.render();
  });

  it("should render properly", function() {
    expect(this.view.$('.DatePicker').length).toBe(1);
    expect(this.view.$('.TimeInput').length).toBe(0);
  });

  describe("date picker", function() {
    it("should be able to change date value", function(done) {
      var changed = false;
      var self = this;
      
      this.model.bind('change:value', function() {
        changed = true;
      });
      
      this.view.$('.js-date-picker').click();
      
      setTimeout(function() {
        $('.datepicker .datepickerSaturday:eq(0) a').click();
        self.view.$el.click();
        expect(changed).toBeTruthy();
        done();
      }, 200);
    });

    it("shouldn't be able to change date when it is disabled", function(done) {
      var changed = false;
      var self = this;

      this.model.set('readOnly', true);
      this.view.render();
      this.view.$('.js-date-picker').click();
      
      setTimeout(function() {
        expect(self.view.datePicker._calendar).toBeUndefined();
        expect(changed).toBeFalsy();
        done();
      }, 100);
    });
  });

  describe("with time", function() {

    beforeEach(function() {
      this.view.options.showTime = true;
      this.view.render();
      this.$input = this.view.$('.TimeInput input');
    });

    it("should render time input if option is enabled", function() {
      expect(this.$input.length).toBe(1);
    });

    it("shouldn't let change value when it is disabled", function() {
      this.model.set('readOnly', true);
      this.view.render();
      expect(this.$input.hasClass('is-disabled'));
      this.$input
        .val('00:00:11')
        .trigger({type: 'keyup', which: 78, keyCode: 78});
      expect(this.model.get('value')).not.toBe('2015-10-10T00:00:11Z');
      expect(this.model.get('value')).toBe('2015-10-10T10:10:10Z');
    });

    it("should only change time part in the global date", function() {
      this.$input
        .val('03:45:11')
        .trigger({type: 'keyup', which: 78, keyCode: 78});

      var date = moment(this.model.get('value')).utc();
      expect(date.hour()).toBe(3);
      expect(date.minutes()).toBe(45);
      expect(date.seconds()).toBe(11);
      expect(date.date()).toBe(10);
      expect(date.year()).toBe(2015);
      expect(date.month()).toBe(9);
    });

  });

  it("should add is-invalid class to the element when value is invalid", function() {
    this.view.options.showTime = true;
    this.view.render();
    var $input = this.view.$('.TimeInput input');

    $input
      .val('00:00:1a')
      .trigger('keyup');
    expect(this.view.$el.hasClass('is-invalid')).toBeTruthy();

    $input
      .val('00:00:01')
      .trigger('keyup');
    expect(this.view.$el.hasClass('is-invalid')).toBeFalsy();
  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

});