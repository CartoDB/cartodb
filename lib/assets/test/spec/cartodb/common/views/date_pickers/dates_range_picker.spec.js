
var DatesRangePicker = require('../../../../../../javascripts/cartodb/common/views/date_pickers/dates_range_picker');

describe('common/views/date_pickers/dates_range_picker', function () {
  beforeEach(function () {
    this.createView = function (opts) {
      var custom = opts || {};
      var defaults = {el: $('<div></div>')};
      return new DatesRangePicker(_.extend(defaults, custom));
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

  it("should set range automatically for the last 30 days", function() {
    var today = moment().utc(0);
    var previous = moment().utc(0).subtract(29, 'days');

    expect(this.view.model.get('fromDate')).toBe(previous.format('YYYY-MM-DD'));
    expect(this.view.model.get('fromHour')).toBe(parseInt(previous.format('H')));
    expect(this.view.model.get('fromMin')).toBe(parseInt(previous.format('m')));

    expect(this.view.model.get('toDate')).toBe(today.format('YYYY-MM-DD'));
    expect(this.view.model.get('toHour')).toBe(parseInt(today.format('H')));
    expect(this.view.model.get('toMin')).toBe(parseInt(today.format('m')));
  });

  describe('date shortcuts', function() {

    beforeEach(function() {
      this.view.render();
      this.generateDateText = function(previous, today) {
        return 'from ' + previous.format('YYYY-MM-DD HH:mm') + ' to ' + today.format('YYYY-MM-DD HH:mm');
      }
    });

    it("should set last 4 hours as date", function() {
      this.view.$('.js-fourHours').click();

      var today = moment().utc(0);
      var previous = moment().utc(0).subtract(4, 'hours');

      expect(this.view.model.get('fromDate')).toBe(previous.format('YYYY-MM-DD'));
      expect(this.view.model.get('fromHour')).toBe(parseInt(previous.format('H')));
      expect(this.view.model.get('fromMin')).toBe(parseInt(previous.format('m')));
      expect(this.view.model.get('toDate')).toBe(today.format('YYYY-MM-DD'));
      expect(this.view.model.get('toHour')).toBe(parseInt(today.format('H')));
      expect(this.view.model.get('toMin')).toBe(parseInt(today.format('m')));

      expect(this.view.$('.js-dates').text()).toContain(this.generateDateText(previous, today));
    });

    it("should set last day as date", function() {
      this.view.$('.js-oneDay').click();
      var today = moment().utc(0);
      var previous = moment().utc(0).subtract(1, 'day');
      expect(this.view.$('.js-dates').text()).toContain(this.generateDateText(previous, today));
    });

    it("should set last week as date", function() {
      this.view.$('.js-oneWeek').click();
      var today = moment().utc(0);
      var previous = moment().utc(0).subtract(1, 'week');
      expect(this.view.$('.js-dates').text()).toContain(this.generateDateText(previous, today));
    });

  });

  describe('render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.js-dates').length).toBe(1);
      expect(this.view.$('button.DatePicker-dates').length).toBe(1);
    });

    it("should set date properly when range is set (automatically to Today)", function() {
      var today = moment().utc(0);
      var previous = moment().utc(0).subtract(29, 'days');
      expect(this.view.$('.js-dates').text()).toContain(
        'from ' + previous.format('YYYY-MM-DD') + ' ' + previous.format('HH:mm') + ' to ' + today.format('YYYY-MM-DD') + ' ' + today.format('HH:mm')
      );
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
