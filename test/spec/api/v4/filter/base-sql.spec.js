const SQLBase = require('../../../../../src/api/v4/filter/base-sql');

const PARAMETER_SPECIFICATION = {
  in: { parameters: [{ name: 'in', allowedTypes: ['Array', 'String'] }] },
  notIn: { parameters: [{ name: 'notIn', allowedTypes: ['Array', 'String'] }] },
  like: { parameters: [{ name: 'like', allowedTypes: ['Array', 'String'] }] }
};

const SQL_TEMPLATES = {
  'in': '<%= column %> IN (<%= value %>)',
  'like': '<%= column %> LIKE <%= value %>'
};

const column = 'fake_column';

describe('api/v4/filter/base-sql', function () {
  describe('constructor', function () {
    it('should throw a descriptive error when column is undefined, not a string, or empty', function () {
      expect(function () {
        new SQLBase(undefined); // eslint-disable-line
      }).toThrowError('Column property is required.');

      expect(function () {
        new SQLBase(1); // eslint-disable-line
      }).toThrowError('Column property must be a string.');

      expect(function () {
        new SQLBase(''); // eslint-disable-line
      }).toThrowError('Column property must be not empty.');
    });

    it('should throw a descriptive error when there is an invalid option', function () {
      expect(function () {
        new SQLBase('fake_column', { unknown_option: false }); // eslint-disable-line
      }).toThrowError("'unknown_option' is not a valid option for this filter.");
    });

    it('should set column and options as class properties', function () {
      const options = { includeNull: true };

      const sqlFilter = new SQLBase(column, options);

      expect(sqlFilter._column).toBe(column);
      expect(sqlFilter._options).toBe(options);
    });
  });

  describe('.set', function () {
    it('should throw a descriptive error when an unknown filter has been passed', function () {
      const sqlFilter = new SQLBase('fake_column');

      expect(function () {
        sqlFilter.set('unknown_filter', 'test_filter');
      }).toThrowError("'unknown_filter' is not a valid filter. Please check documentation.");
    });

    it('should set the new filter to the filters object', function () {
      const sqlFilter = new SQLBase(column);
      sqlFilter.ALLOWED_FILTERS = ['in'];
      sqlFilter.PARAMETER_SPECIFICATION = { in: PARAMETER_SPECIFICATION.in };

      sqlFilter.set('in', ['test_filter']);

      expect(sqlFilter._filters).toEqual({ in: ['test_filter'] });
    });

    it("should trigger a 'change:filters' event", function () {
      const spy = jasmine.createSpy();

      const sqlFilter = new SQLBase('fake_column');
      sqlFilter.ALLOWED_FILTERS = ['in'];
      sqlFilter.PARAMETER_SPECIFICATION = { in: PARAMETER_SPECIFICATION.in };
      sqlFilter.on('change:filters', spy);

      sqlFilter.set('in', ['test_filter']);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('.setFilters', function () {
    it('should throw a descriptive error when an unknown filter has been passed', function () {
      const sqlFilter = new SQLBase('fake_column');

      expect(function () {
        sqlFilter.setFilters({ unknown_filter: 'test_filter' });
      }).toThrowError("'unknown_filter' is not a valid filter. Please check documentation.");
    });

    it('should set the new filters and override previous ones', function () {
      const newFilters = { notIn: 'test_filter2' };

      const sqlFilter = new SQLBase(column);
      sqlFilter.ALLOWED_FILTERS = ['in', 'notIn'];
      sqlFilter.PARAMETER_SPECIFICATION = {
        in: PARAMETER_SPECIFICATION.in,
        notIn: PARAMETER_SPECIFICATION.notIn
      };
      sqlFilter.set('in', ['test_filter']);

      sqlFilter.setFilters(newFilters);

      expect(sqlFilter._filters).toEqual(newFilters);
    });

    it("should trigger a 'change:filters' event", function () {
      const newFilters = { notIn: 'test_filter2' };
      const spy = jasmine.createSpy();

      const sqlFilter = new SQLBase(column);
      sqlFilter.ALLOWED_FILTERS = ['in', 'notIn'];
      sqlFilter.PARAMETER_SPECIFICATION = {
        in: PARAMETER_SPECIFICATION.in,
        notIn: PARAMETER_SPECIFICATION.notIn
      };
      sqlFilter.set('in', ['test_filter']);
      sqlFilter.on('change:filters', spy);

      sqlFilter.setFilters(newFilters);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('.resetFilters', function () {
    it('should reset applied filters', function () {
      const sqlFilter = new SQLBase(column);
      sqlFilter.ALLOWED_FILTERS = ['in'];
      sqlFilter.PARAMETER_SPECIFICATION = { in: PARAMETER_SPECIFICATION.in };
      sqlFilter.set('in', ['test_filter']);

      sqlFilter.resetFilters();

      expect(sqlFilter._filters).toEqual({});
    });
  });

  describe('.$getSQL', function () {
    it('should return SQL string containing all the filters joined by AND clause', function () {
      const sqlFilter = new SQLBase(column);
      sqlFilter.ALLOWED_FILTERS = ['in', 'like'];
      sqlFilter.PARAMETER_SPECIFICATION = {
        in: PARAMETER_SPECIFICATION.in,
        like: PARAMETER_SPECIFICATION.like
      };
      sqlFilter.SQL_TEMPLATES = {
        in: SQL_TEMPLATES.in,
        like: SQL_TEMPLATES.like
      };
      sqlFilter.setFilters({ in: ['category 1', 'category 2'], like: '%category%' });

      expect(sqlFilter.$getSQL()).toBe("(fake_column IN ('category 1','category 2') AND fake_column LIKE '%category%')");
    });

    it('should call _includeNullInQuery if includeNull option is set', function () {
      const sqlFilter = new SQLBase(column, { includeNull: true });
      sqlFilter.ALLOWED_FILTERS = ['in'];
      sqlFilter.PARAMETER_SPECIFICATION = { in: PARAMETER_SPECIFICATION.in };
      sqlFilter.SQL_TEMPLATES = { in: SQL_TEMPLATES.in };
      sqlFilter.setFilters({ in: ['category 1', 'category 2'] });

      spyOn(sqlFilter, '_includeNullInQuery');

      sqlFilter.$getSQL();

      expect(sqlFilter._includeNullInQuery).toHaveBeenCalled();
    });
  });

  describe('.checkFilters', function () {
    let sqlFilter;

    beforeEach(function () {
      sqlFilter = new SQLBase(column);
    });

    it('should throw an error when an invalid filter is passed', function () {
      expect(function () {
        sqlFilter._checkFilters({ unknown_filter: 'filter' });
      }).toThrowError("'unknown_filter' is not a valid filter. Please check documentation.");
    });

    it("should throw an error when there's a type mismatching in filter parameters", function () {
      expect(function () {
        sqlFilter.ALLOWED_FILTERS = ['in'];
        sqlFilter.PARAMETER_SPECIFICATION = { in: PARAMETER_SPECIFICATION.in };

        sqlFilter._checkFilters({ in: 1 });
      }).toThrowError("Invalid parameter type for 'in'. Please check filters documentation.");
    });
  });

  describe('._convertValueToSQLString', function () {
    it('should format date to ISO8601 string', function () {
      const sqlFilter = new SQLBase(column);

      const fakeDate = new Date('Thu Jun 28 2018 15:04:31 GMT+0200 (Central European Summer Time)');
      expect(sqlFilter._convertValueToSQLString(fakeDate)).toBe("'2018-06-28T13:04:31.000Z'");
    });

    it('should convert array to a comma-separated string wrapped by single comma', function () {
      const sqlFilter = new SQLBase(column);

      const fakeArray = ['Element 1', 'Element 2'];
      expect(sqlFilter._convertValueToSQLString(fakeArray)).toBe("'Element 1','Element 2'");
    });

    it('should return number without modifying', function () {
      const sqlFilter = new SQLBase(column);

      expect(sqlFilter._convertValueToSQLString(1)).toBe(1);
    });

    it('should return object with string values without modifying', function () {
      const sqlFilter = new SQLBase(column);

      const fakeObject = { fakeProperty: 'fakeValue' };

      expect(sqlFilter._convertValueToSQLString(fakeObject)).toBe(fakeObject);
    });

    it('should return object with date values parsed properly', function () {
      const sqlFilter = new SQLBase(column);

      const fakeObject = { fakeDate: new Date('2014-01-01T00:00:00.00Z') };

      expect(sqlFilter._convertValueToSQLString(fakeObject)).toBe({ fakeDate: '2014-01-01T00:00:00.000Z' });
    });

    it('should wrap strings in single-quotes', function () {
      const sqlFilter = new SQLBase(column);

      const fakeString = 'fake_string';

      expect(sqlFilter._convertValueToSQLString(fakeString)).toBe(`'${fakeString}'`);
    });
  });

  describe('._interpolateFilterIntoTemplate', function () {
    it('should inject filter values into SQL template', function () {
      const sqlFilter = new SQLBase(column);

      sqlFilter.SQL_TEMPLATES = {
        gte: '<%= column %> > <%= value %>'
      };

      expect(sqlFilter._interpolateFilter('gte', 10)).toBe('fake_column > 10');
    });
  });
});
