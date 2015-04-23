describe('cdb.geo.ui.TimeSlider', function() {
  var view;
  var layer;

  beforeEach(function() {
    layer = new Backbone.Model();
    view = new cdb.geo.ui.TimeSlider({
      layer: layer,
      width: "auto"
    });
  });

  describe(".formatterForRange", function() {
    var formatter;

    /**
     * @param {String} str (Optional) e.g. "2014-11-19T13:17:42Z" ATTENTION! This format must be used for Dates to be
     * created as expected when running the tests on PhantomJS, you can find the report here:
     * https://code.google.com/p/phantomjs/issues/detail?id=187 until the fix is included in the same version we use
     * we must use dates this way.
     * @return {Number} a Unix timestamp
     */
    var time = function time(str) {
      return Date.parse(str)
    };

    describe("given a range is within the same day", function() {
      beforeEach(function() {
        var start = time("2014-11-19T09:13:00Z");
        var end = time("2014-11-19T18:37:00Z");
        formatter = view.formatterForRange(start, end)
      });

      it("should return a formatter function that renders the UTC time of given moment", function() {
        var moment = new Date("2014-11-19T15:04:00Z");
        expect(formatter(moment)).toEqual("15:04");
      });
    });

    describe("given a range is within the same year", function() {
      beforeEach(function() {
        var start = time("2014-11-19T12:00:00Z");
        var end = Date.parse("Dec 24, 2014 12:00 GMT+01");
        formatter = view.formatterForRange(start, end)
      });

      it("should return a formatter function that renders the month/day/year (US format) of given moment", function() {
        var moment = new Date("2014-11-20T12:00:00Z");
        expect(formatter(moment)).toEqual("11/20/2014");
      });
    });

    describe("given a range is more than a year", function() {
      beforeEach(function() {
        var start = time("2014-01-19T12:00:00Z");
        var end = time("2015-02-01T12:00:00Z");
        formatter = view.formatterForRange(start, end)
      });

      it("should return a formatter function that renders the month and year of given moment", function() {
        var moment = new Date("2014-11-27T12:00:00Z");
        expect(formatter(moment)).toEqual("11/2014")
      });
    });

    describe("given a step that spans more than 48 hours", function() {
      beforeEach(function() {
        var start = 1423699205000;
        var end = 1424649534000;
        view.torqueLayer.getTimeBounds = function(){return {start: start, end: end}};
        view.torqueLayer.options = {steps: 5};
        formatter = view.formatterForRange(start, end);
      });
      it("should return a formatter function that defines a two-date range", function() {
        var moment = new Date(1424269402400);
        expect(formatter(moment, view.torqueLayer)).toEqual("Feb 18 - Feb 20");
      });
    });

    describe("given a range is less than a day but spanning two dates", function() {
      beforeEach(function() {
        var start = time("2014-11-19T23:33:00Z");
        var end = time("2014-11-20T09:42:00Z");
        formatter = view.formatterForRange(start, end)
      });

      it("should return a formatter function that renders both date and UTC time", function() {
        var moment = new Date("2014-11-20T01:16:00Z");
        expect(formatter(moment)).toEqual("11/20/2014 01:16")
      });
    });
  });
});
