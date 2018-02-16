var Backbone = require('backbone');
var moment = require('moment');
var TimeSeriesQueryModel = require('builder/editor/widgets/time-series-query-model');

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
      this.model._calculateBuckets(1483228800000, 1451606400000); // 2016-01-01 to 2017-01-01
      var expected = [
        { bins: 527041, val: 'minute', label: 'Minutes' },
        { bins: 8785, val: 'hour', 'label': 'Hours' },
        { bins: 367, val: 'day', label: 'Days' },
        { bins: 54, val: 'week', label: 'Weeks' },
        { bins: 13, val: 'month', label: 'Months' },
        { bins: 5, val: 'quarter', label: 'Quarters' },
        { bins: 2, val: 'year', label: 'Years' },
        { bins: 1, val: 'decade', label: 'Decades' }
      ];
      expect(this.model.get('buckets')).toEqual(expected);
    });

    it('should get the right decades value', function () {
      this.model._calculateBuckets(946684800000, 283996800000); // 1979 to 2000
      var expectedDecades = 4; // 70s, 80s, 90s, 00s
      var buckets = this.model.get('buckets');

      expect(buckets[7].val).toEqual('decade');
      expect(buckets[7].bins).toBe(expectedDecades);
    });
  });

  describe('._calculateDecadesDiff', function () {
    function fromYear (year) {
      var dateString = year.toString() + '-01-01';
      return moment(dateString);
    }

    function assertDecadeDiff (startYear, endYear, expectedDiff) {
      var diff = this.model._calculateDecadesDiff(fromYear(startYear), fromYear(endYear));
      expect(diff).toBe(expectedDiff);
    }

    it('should return proper values', function () {
      var assertDiff = assertDecadeDiff.bind(this);

      assertDiff(1970, 1970, 1);
      assertDiff(1970, 1979, 1);
      assertDiff(1970, 1980, 2);
      assertDiff(1970, 1999, 3);
      assertDiff(1970, 2000, 4);
      assertDiff(1500, 1999, 50);
    });
  });

  describe('.getFilteredBuckets', function () {
    it('should return the buckets below the limit', function () {
      this.model._calculateBuckets(1483228800000, 1451606400000);
      var filteredBuckets = this.model.getFilteredBuckets(367); // Maximum 367 bins
      var expected = [
        { bins: 367, val: 'day', label: 'Days' },
        { bins: 54, val: 'week', label: 'Weeks' },
        { bins: 13, val: 'month', label: 'Months' },
        { bins: 5, val: 'quarter', label: 'Quarters' },
        { bins: 2, val: 'year', label: 'Years' },
        { bins: 1, val: 'decade', label: 'Decades' }
      ];
      expect(filteredBuckets).toEqual(expected);
    });
  });

  describe('.getPreferredBucket', function () {
    it('should return the bucket closer to the max bins', function () {
      this.model._calculateBuckets(1483228800000, 1451606400000);
      var preferredBucket = this.model.getPreferredBucket(367); // Maximum 367 bins
      var expected = { bins: 367, val: 'day', label: 'Days' };
      expect(preferredBucket).toEqual(expected);
    });
  });
});
