var _ = require('underscore');
var HistogramDataModel = require('../../../../src/dataviews/histogram-dataview/histogram-data-model');

describe('dataviews/histogram-data-model', function () {
  var apiKey = 'ac3560ef-78f8-45d8-b043-5544f8a76753';
  var url = 'https://carto.geo';
  var defaultBins = 45;

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

  it('defaults', function () {
    expect(_.isArray(this.model.get('data'))).toBe(true);
    expect(this.model.get('data').length).toBe(0);
    expect(this.model.get('localTimezone')).toBe(false);
    expect(this.model.get('localOffset')).toBe(0);
  });

  describe('._initBinds', function () {
    beforeEach(function () {
      spyOn(this.model, 'fetch');
    });

    afterEach(function () {
      this.model.set({
        url: url,
        aggregation: undefined,
        bins: defaultBins
      }, { silent: true });
    });

    it('should call to fetch when the url changes', function () {
      this.model.set('url', 'https://carto.geo/aa45');

      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should call to fetch when the aggregation changes to a defined value in a date column', function () {
      this.model.set('column_type', 'date', { silent: true });

      this.model.set('aggregation', 'month');

      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should not call to fetch when the aggregation changes to an undefined value in a date column', function () {
      this.model.set('column_type', 'date', { silent: true });

      this.model.set('aggregation', undefined);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should call to fetch when the bins changes to a defined value in a number column', function () {
      this.model.set('column_type', 'number', { silent: true });

      this.model.set('bins', defaultBins + 1);

      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should call to fetch when localTimezone changes', function () {
      var originalValue = this.model.get('localTimezone');

      this.model.set('localTimezone', !originalValue);

      expect(this.model.fetch).toHaveBeenCalled();
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

  describe('._getCurrentOffset', function () {
    beforeEach(function () {
      this.model.set({
        offset: 7200,
        localOffset: 43200
      }, { silent: true });
    });

    it('should return offset if `localTimezone` is not set', function () {
      this.model.set('localTimezone', false, { silent: true });

      var offset = this.model._getCurrentOffset();

      expect(offset).toBe(7200);
    });

    it('should return local offset if `localTimezone` is set', function () {
      this.model.set('localTimezone', true, { silent: true });

      var offset = this.model._getCurrentOffset();

      expect(offset).toBe(43200);
    });
  });
});
