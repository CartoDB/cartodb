var _ = require('underscore');
var HistogramDataModel = require('../../../../src/dataviews/histogram-dataview/histogram-data-model');

describe('dataviews/histogram-data-model', function () {
  var apiKey = 'ac3560ef-78f8-45d8-b043-5544f8a76753';
  var url = 'https://carto.geo';

  function buildUrl (params) {
    var urlParams = _.map(_.keys(params), function (key) {
      return key + '=' + params[key];
    });
    return url + '?' + urlParams.join('&');
  }

  beforeEach(function () {
    this.model = new HistogramDataModel({
      apiKey: apiKey,
      url: url
    });
  });

  describe('.url', function () {
    it('should return no bins param if type is number and bins is undefined', function () {
      this.model.set({ column_type: 'number' });

      var url = this.model.url();

      expect(url).toEqual(buildUrl({ api_key: apiKey }));
    });

    it('should return bins param if type is number and bins is defined', function () {
      this.model.set({
        column_type: 'number',
        bins: 48
      });

      var url = this.model.url();

      expect(url).toEqual(buildUrl({
        bins: 48,
        api_key: apiKey
      }));
    });

    it('should return aggregation auto if type is date and aggregation is undefined', function () {
      this.model.set({
        column_type: 'date',
        aggregation: undefined
      });

      var url = this.model.url();

      expect(url).toEqual(buildUrl({
        aggregation: 'auto',
        api_key: apiKey
      }));
    });

    it('should return aggregation if type is date and aggregation is defined', function () {
      this.model.set({
        column_type: 'date',
        aggregation: 'minute'
      });

      var url = this.model.url();

      expect(url).toEqual(buildUrl({
        aggregation: 'minute',
        api_key: apiKey
      }));
    });
  });
});
