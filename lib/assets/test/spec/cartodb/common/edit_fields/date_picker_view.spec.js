var cdb = require('cartodb.js');
var moment = require('moment');
var DateRangeView = require('../../../../../javascripts/cartodb/common/views/date_pickers/dates_range_picker');


describe('Date picker', function() {

  beforeEach(function() {
    this.view = new DateRangeView();
    this.view.render();
  });

  it("should render properly", function() {
    expect(this.view.$('.js-dates').length).toBe(1);
    expect(this.view.$('.DatePicker-dropdown').length).toBe(1);
  });

  it("should set date properly when range is set", function() {
    var today = moment().utc(0);
    var previous = moment().utc(0).subtract(29, 'days');

    expect(this.view.model.get('fromDate')).toBe(previous.format('YYYY-MM-DD'));
    expect(this.view.model.get('fromHour')).toBe(parseInt(previous.format('H')));
    expect(this.view.model.get('fromMin')).toBe(parseInt(previous.format('m')));
    expect(this.view.model.get('toDate')).toBe(today.format('YYYY-MM-DD'));
    expect(this.view.model.get('toHour')).toBe(parseInt(today.format('H')));
    expect(this.view.model.get('toMin')).toBe(parseInt(today.format('m')));

    expect(this.view.$('.js-dates').text()).toContain(
      'From ' + previous.format('YYYY-MM-DD') + ' ' + previous.format('HH:mm') + ' to ' + today.format('YYYY-MM-DD') + ' ' + today.format('HH:mm')
    );
  });

  describe('date shortcuts', function() {

    beforeEach(function() {

      this.generateDateText = function(previous, today) {
        return 'From ' + previous.format('YYYY-MM-DD') + ' ' + previous.format('HH:mm') + ' to ' + today.format('YYYY-MM-DD') + ' ' + today.format('HH:mm')
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
  
});
