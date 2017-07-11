var Backbone = require('backbone');
var TimeSeriesQueryModel = require('../../../../../javascripts/cartodb3/editor/widgets/time-series-query-model');

describe('editor/widgets/time-series-query-model', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      user_name: '/u/pepe',
      sql_api_template: 'SELECT * from test;',
      api_key: '1238asd234239asd89asd123'
    });

    var querySchemaModel = new Backbone.Model({
      status: 'fetched'
    });

    querySchemaModel.getColumnType = function () {
      return 'date';
    };

    this.model = new TimeSeriesQueryModel({
      column: 'cartodb_id'
    }, {
      configModel: configModel,
      querySchemaModel: querySchemaModel
    });
  });

  it('should call _queryData when change:column', function () {
    spyOn(this.model, '_queryData');
    this.model._initBinds();
    this.model.trigger('change:column');

    expect(this.model._queryData).toHaveBeenCalled();
  });

  it('should call _onQuerySchemaStatusChanged when _querySchemaModel change:status', function () {
    spyOn(this.model, '_onQuerySchemaStatusChanged');
    this.model._initBinds();
    this.model._querySchemaModel.trigger('change:status');

    expect(this.model._onQuerySchemaStatusChanged).toHaveBeenCalled();
  });

  describe('._onQuerySchemaStatusChanged', function () {
    it('should call ._queryData if _querySchemaModel is fetched', function () {
      spyOn(this.model, '_queryData');

      this.model._querySchemaModel.set('status', 'unfetched');
      this.model._onQuerySchemaStatusChanged();
      expect(this.model._queryData).not.toHaveBeenCalled();

      this.model._querySchemaModel.set('status', 'fetched');
      this.model._onQuerySchemaStatusChanged();
      expect(this.model._queryData).toHaveBeenCalled();
    });
  });

  describe('._queryData', function () {
    it('should set the status to fetching', function () {
      spyOn(this.model._SQL, 'execute');
      this.model.set('status', 'unfetched');
      this.model._queryData();
      expect(this.model.get('status')).toEqual('fetching');
    });

    it('should call _SQL.execute', function () {
      spyOn(this.model._SQL, 'execute');
      this.model._queryData();
      expect(this.model._SQL.execute).toHaveBeenCalled();
    });
  });

  describe('._onQuerySuccess', function () {
    it('should set the status to fetched', function () {
      this.model._onQuerySuccess({});
      expect(this.model.get('status')).toEqual('fetched');
    });

    it('should call ._calculateBuckets', function () {
      spyOn(this.model, '_calculateBuckets');
      this.model._onQuerySuccess({});
      expect(this.model._calculateBuckets).toHaveBeenCalled();
    });
  });

  describe('._onQueryError', function () {
    it('should set the status to unavailable', function () {
      this.model._onQueryError({});
      expect(this.model.get('status')).toEqual('unavailable');
    });
  });

  describe('._calculateBuckets', function () {
    it('sets the buckets with the correct values', function () {
      this.model._calculateBuckets(300); // 300 Days
      var expected = [
        { bins: 432000, val: 'minute', label: 'Minutes' },
        { bins: 7200, val: 'hour', 'label': 'Hours' },
        { bins: 300, val: 'day', label: 'Days' },
        { bins: 43, val: 'week', label: 'Weeks' },
        { bins: 10, val: 'month', label: 'Months' },
        { bins: 4, val: 'quarter', label: 'Quarters' },
        { bins: 1, val: 'year', label: 'Years' }
      ];
      expect(this.model.get('buckets')).toEqual(expected);
    });
  });

  describe('.getFilteredBuckets', function () {
    it('should return the buckets below the limit', function () {
      this.model._calculateBuckets(300); // 300 Days
      var filteredBuckets = this.model.getFilteredBuckets(366);  // Maximum 366 bins
      var expected = [
        { bins: 300, val: 'day', label: 'Days' },
        { bins: 43, val: 'week', label: 'Weeks' },
        { bins: 10, val: 'month', label: 'Months' },
        { bins: 4, val: 'quarter', label: 'Quarters' },
        { bins: 1, val: 'year', label: 'Years' }
      ];
      expect(filteredBuckets).toEqual(expected);
    });
  });

  describe('.getPreferredBucket', function () {
    it('should return the bucket closer to the max bins', function () {
      this.model._calculateBuckets(300); // 300 Days
      var preferredBUcket = this.model.getPreferredBucket(366);  // Maximum 366 bins
      var expected = { bins: 300, val: 'day', label: 'Days' };
      expect(preferredBUcket).toEqual(expected);
    });
  });
});
