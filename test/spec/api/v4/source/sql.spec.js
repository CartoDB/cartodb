const Base = require('../../../../../src/api/v4/source/base');
const carto = require('../../../../../src/api/v4');

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
      }).toThrowError('SQL Source must have a SQL query.');
    });

    it('should throw an error if query is empty', function () {
      expect(function () {
        new carto.source.SQL(''); // eslint-disable-line
      }).toThrowError('SQL Source must have a SQL query.');
    });

    it('should throw an error if query is not a valid string', function () {
      expect(function () {
        new carto.source.SQL(3333); // eslint-disable-line
      }).toThrowError('SQL Query must be a string.');
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
      }).toThrowError('SQL Source must have a SQL query.');
    });

    it('should throw an error if query is not a valid string', function () {
      expect(function () {
        sqlQuery.setQuery(333);
      }).toThrowError('SQL Query must be a string.');
    });

    it('should trigger an queryChanged event when there is no internal model', function (done) {
      var expectedQuery = 'SELECT * FROM ne_10m_populated_places_simple LIMIT 10';
      sqlQuery.on('queryChanged', function (newQuery) {
        expect(newQuery).toEqual(expectedQuery);
        done();
      });
      sqlQuery.setQuery(expectedQuery);
    });

    it('should trigger an queryChanged event when there is an internal model', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var style = new carto.style.CartoCSS('#layer { marker-fill: red; }');
      var layer = new carto.layer.Layer(sqlQuery, style);
      var queryChangedSpy = jasmine.createSpy('queryChangedSpy');
      var newQuery = 'SELECT * FROM ne_10m_populated_places_simple LIMIT 10';

      sqlQuery.on('queryChanged', queryChangedSpy);

      client.addLayer(layer)
        .then(function () {
          return sqlQuery.setQuery(newQuery);
        })
        .then(function () {
          expect(queryChangedSpy).toHaveBeenCalledWith(newQuery);
          done();
        });
    });

    it('should return a resolved promise when there is no internal model', function (done) {
      var newQuery = 'SELECT * FROM ne_10m_populated_places_simple';
      sqlQuery.setQuery(newQuery)
        .then(function () {
          expect(sqlQuery.getQuery()).toEqual(newQuery);
          done();
        });
    });

    it('should return a resolved promise when there is an internal model', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var style = new carto.style.CartoCSS('#layer { marker-fill: red; }');
      var layer = new carto.layer.Layer(sqlQuery, style);
      var newQuery = 'SELECT * FROM ne_10m_populated_places_simple LIMIT 10';
      client.addLayer(layer)
        .then(function () {
          return sqlQuery.setQuery(newQuery);
        })
        .then(function () {
          expect(sqlQuery.getQuery()).toEqual(newQuery);
          done();
        });
    });

    it('should return a rejected promise with a CartoError when there is an internal model (and a reload error)', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var style = new carto.style.CartoCSS('#layer { marker-fill: red; }');
      var layer = new carto.layer.Layer(sqlQuery, style);
      var newQuery = 'SELECT * FROM invalid_dataset';
      client.addLayer(layer)
        .then(function () {
          return sqlQuery.setQuery(newQuery);
        })
        .catch(function (cartoError) {
          expect(cartoError.message).toMatch(/Invalid dataset name used. Dataset "invalid_dataset" does not exist./);
          done();
        });
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

  describe('.getQueryToApply', function () {
    let populatedPlacesSQL;

    beforeEach(function () {
      populatedPlacesSQL = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple');
      spyOn(populatedPlacesSQL, '_updateInternalModelQuery');
    });

    it('should return original query if applied filters returns no SQL', function () {
      expect(populatedPlacesSQL._getQueryToApply()).toBe('SELECT * FROM ne_10m_populated_places_simple');
    });

    it('should return wrapped query if filters are applied', function () {
      populatedPlacesSQL.addFilter(new carto.filter.Category('fake_column', { in: ['category'] }));

      expect(populatedPlacesSQL._getQueryToApply()).toBe("SELECT * FROM (SELECT * FROM ne_10m_populated_places_simple) as originalQuery WHERE fake_column IN ('category')");
    });
  });

  describe('.addFilter', function () {
    let populatedPlacesSQL;

    beforeEach(function () {
      spyOn(Base.prototype, 'addFilter');

      populatedPlacesSQL = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple');
      spyOn(populatedPlacesSQL, '_updateInternalModelQuery');
    });

    it('should call original addFilter and _updateInternalModelQuery', function () {
      populatedPlacesSQL.addFilter(new carto.filter.Category('fake_column', { in: ['category'] }));

      expect(Base.prototype.addFilter).toHaveBeenCalled();
      expect(populatedPlacesSQL._updateInternalModelQuery).toHaveBeenCalledWith(populatedPlacesSQL._getQueryToApply());
    });
  });

  describe('.removeFilter', function () {
    let populatedPlacesDataset, filter;

    beforeEach(function () {
      spyOn(Base.prototype, 'addFilter');

      populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      spyOn(populatedPlacesDataset, '_updateInternalModelQuery');

      filter = populatedPlacesDataset.addFilter(new carto.filter.Category('fake_column', { in: ['category'] }));
      populatedPlacesDataset.addFilter(filter);
    });

    it('should call original removeFilter and _updateInternalModelQuery', function () {
      populatedPlacesDataset.removeFilter(filter);

      expect(Base.prototype.addFilter).toHaveBeenCalled();
      expect(populatedPlacesDataset._updateInternalModelQuery).toHaveBeenCalledWith(populatedPlacesDataset._getQueryToApply());
    });
  });

  describe('.getFilters', function () {
    let populatedPlacesDataset, filter;

    beforeEach(function () {
      filter = new carto.filter.Category('fake_column', { in: ['category'] });

      populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      populatedPlacesDataset.addFilter(filter);
    });

    it('should return added filters', function () {
      expect(populatedPlacesDataset.getFilters()).toEqual([filter]);
    });
  });

  describe('errors', function () {
    it('should trigger an error when invalid', function (done) {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      // The following sql has the invalid operator: ===
      var invalidSource = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name === \'Spain\'');
      var cartoCss = new carto.style.CartoCSS('#layer { marker-fill: red; }');

      invalidSource.on('error', function (cartoError) {
        expect(cartoError.message).toMatch(/operator does not exist/);
        done();
      });
      var layer = new carto.layer.Layer(invalidSource, cartoCss);

      client.addLayer(layer).catch(function () { }); // Prevent console "uncaught error" warning.
    });

    it('should trigger a CartoError when there is an error in the internal model', function () {
      var client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      var source = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple');
      var cartoCss = new carto.style.CartoCSS('#layer { marker-fill: red; }');
      var layer = new carto.layer.Layer(source, cartoCss);
      var spy = jasmine.createSpy('spy');
      source.on(carto.events.ERROR, spy);
      client.addLayer(layer);

      source._internalModel.set('error', 'an error');

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'CartoError',
        originalError: 'an error'
      }));
    });
  });
});
