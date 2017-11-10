var carto = require('../../../../../src/api/v4');

describe('api/v4/source/sql', function () {
  var sqlQuery;

  beforeEach(function () {
    sqlQuery = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = \'Spain\'');
  });

  describe('constructor', function () {
    it('should return a new Dataset object', function () {
      expect(sqlQuery).toBeDefined();
    });

    it('should autogenerate an id', function () {
      expect(sqlQuery.getId()).toMatch(/S\d+/);
    });

    it('should throw an error if query is not provided', function () {
      expect(function () {
        new carto.source.SQL(); // eslint-disable-line
      }).toThrowError('query is required.');
    });

    it('should throw an error if query is empty', function () {
      expect(function () {
        new carto.source.SQL(''); // eslint-disable-line
      }).toThrowError('query is required.');
    });

    it('should throw an error if query is not a valid string', function () {
      expect(function () {
        new carto.source.SQL(3333); // eslint-disable-line
      }).toThrowError('query must be a string.');
    });
  });

  describe('.setQuery', function () {
    it('should set the query', function () {
      sqlQuery.setQuery('SELECT foo FROM bar');
      expect(sqlQuery.getQuery()).toEqual('SELECT foo FROM bar');
    });

    it('should throw an error if query is empty', function () {
      expect(function () {
        sqlQuery.setQuery('');
      }).toThrowError('query is required.');
    });

    it('should throw an error if query is not a valid string', function () {
      expect(function () {
        sqlQuery.setQuery(333);
      }).toThrowError('query must be a string.');
    });
  });

  describe('$setEngine', function () {
    it('should create an internal model with the dataset attrs and the engine', function () {
      sqlQuery.$setEngine('fakeEngine');

      var internalModel = sqlQuery.$getInternalModel();
      expect(internalModel.get('id')).toEqual(sqlQuery.getId());
      expect(internalModel.get('query')).toEqual('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = \'Spain\'');
      expect(internalModel._engine).toEqual('fakeEngine');
    });
  });
});
