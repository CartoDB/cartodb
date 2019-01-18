const Base = require('../../../../../src/api/v4/source/base');
const carto = require('../../../../../src/api/v4');

describe('api/v4/source/dataset', function () {
  var originalTimeout;

  beforeEach(function () {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  describe('constructor', function () {
    it('should return a new Dataset object', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      expect(populatedPlacesDataset).toBeDefined();
    });

    it('should autogenerate an id when no ID is given', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      expect(populatedPlacesDataset.getId()).toMatch(/S\d+/);
    });

    it('should throw an error if tableName is not provided', function () {
      expect(function () {
        new carto.source.Dataset(); // eslint-disable-line
      }).toThrowError('Table name is required.');
    });

    it('should throw an error if tableName is empty', function () {
      expect(function () {
        new carto.source.Dataset(''); // eslint-disable-line
      }).toThrowError('Table name must be not empty.');
    });

    it('should throw an error if tableName is not a valid string', function () {
      expect(function () {
        new carto.source.Dataset(3333); // eslint-disable-line
      }).toThrowError('Table name must be a string.');
    });
  });

  describe('.setTableName', function () {
    let populatedPlacesDataset;

    beforeEach(function () {
      populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
    });

    it('should set the dataset', function () {
      populatedPlacesDataset.setTableName('airbnb_listings');
      expect(populatedPlacesDataset.getTableName()).toEqual('airbnb_listings');
    });

    it('should throw an error if query is empty', function () {
      expect(function () {
        populatedPlacesDataset.setTableName(undefined);
      }).toThrowError('Table name is required.');
    });

    it('should throw an error if query is not a valid string', function () {
      expect(function () {
        populatedPlacesDataset.setTableName(333);
      }).toThrowError('Table name must be a string.');
    });

    it('should throw an error if query is empty', function () {
      expect(function () {
        populatedPlacesDataset.setTableName('');
      }).toThrowError('Table name must be not empty.');
    });

    it('should trigger an tableNameChanged event when there is no internal model', function (done) {
      const expectedTable = 'airbnb_listings';

      populatedPlacesDataset.on('tableNameChanged', function (newQuery) {
        expect(newQuery).toEqual(expectedTable);
        done();
      });

      populatedPlacesDataset.setTableName(expectedTable);
    });

    it('should trigger an tableNameChanged event when there is an internal model', function (done) {
      const client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      const style = new carto.style.CartoCSS('#layer { marker-fill: red; }');
      const layer = new carto.layer.Layer(populatedPlacesDataset, style);
      const tableNameChangedSpy = jasmine.createSpy('tableNameChangedSpy');
      const newTableName = 'airbnb_listings';

      populatedPlacesDataset.on('tableNameChanged', tableNameChangedSpy);

      client.addLayer(layer)
        .then(function () {
          return populatedPlacesDataset.setTableName(newTableName);
        })
        .then(function () {
          expect(tableNameChangedSpy).toHaveBeenCalledWith(newTableName);
          done();
        });
    });

    it('should return a resolved promise when there is no internal model', function (done) {
      const newTableName = 'airbnb_listings';
      populatedPlacesDataset.setTableName(newTableName)
        .then(function () {
          expect(populatedPlacesDataset.getTableName()).toEqual(newTableName);
          done();
        });
    });

    it('should return a resolved promise when there is an internal model', function (done) {
      const client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      const style = new carto.style.CartoCSS('#layer { marker-fill: red; }');
      const layer = new carto.layer.Layer(populatedPlacesDataset, style);
      const newTableName = 'airbnb_listings';

      client.addLayer(layer)
        .then(function () {
          return populatedPlacesDataset.setTableName(newTableName);
        })
        .then(function () {
          expect(populatedPlacesDataset.getTableName()).toEqual(newTableName);
          done();
        });
    });

    it('should return a rejected promise with a CartoError when there is an internal model (and a reload error)', function (done) {
      const client = new carto.Client({
        apiKey: '84fdbd587e4a942510270a48e843b4c1baa11e18',
        username: 'cartojs-test'
      });
      const style = new carto.style.CartoCSS('#layer { marker-fill: red; }');
      const layer = new carto.layer.Layer(populatedPlacesDataset, style);
      const newTableName = 'invalid_dataset';

      client.addLayer(layer)
        .then(function () {
          return populatedPlacesDataset.setTableName(newTableName);
        })
        .catch(function (cartoError) {
          expect(cartoError.message).toMatch(/Invalid dataset name used. Dataset "invalid_dataset" does not exist./);
          done();
        });
    });
  });

  describe('.getTableName', function () {
    it('should return the table name', function () {
      var dataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      expect(dataset.getTableName()).toBe('ne_10m_populated_places_simple');
    });
  });

  describe('$setEngine', function () {
    it('should create an internal model with the dataset and the engine', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');

      populatedPlacesDataset.$setEngine('fakeEngine');

      var internalModel = populatedPlacesDataset.$getInternalModel();
      expect(internalModel.get('id')).toEqual(populatedPlacesDataset.getId());
      expect(internalModel.get('query')).toEqual('SELECT * from ne_10m_populated_places_simple');
      expect(internalModel._engine).toEqual('fakeEngine');
    });
  });

  describe('.getQueryToApply', function () {
    let populatedPlacesDataset;

    beforeEach(function () {
      populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      spyOn(populatedPlacesDataset, '_updateInternalModelQuery');
    });

    it('should return original query if applied filters returns no SQL', function () {
      expect(populatedPlacesDataset._getQueryToApply()).toBe('SELECT * from ne_10m_populated_places_simple');
    });

    it('should return wrapped query if filters are applied', function () {
      populatedPlacesDataset.addFilter(new carto.filter.Category('fake_column', { in: ['category'] }));

      expect(populatedPlacesDataset._getQueryToApply()).toBe("SELECT * FROM (SELECT * from ne_10m_populated_places_simple) as datasetQuery WHERE fake_column IN ('category')");
    });
  });

  describe('.addFilter', function () {
    let populatedPlacesDataset;

    beforeEach(function () {
      spyOn(Base.prototype, 'addFilter');

      populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      spyOn(populatedPlacesDataset, '_updateInternalModelQuery');
    });

    it('should call original addFilter and _updateInternalModelQuery', function () {
      populatedPlacesDataset.addFilter(new carto.filter.Category('fake_column', { in: ['category'] }));

      expect(Base.prototype.addFilter).toHaveBeenCalled();
      expect(populatedPlacesDataset._updateInternalModelQuery).toHaveBeenCalledWith(populatedPlacesDataset._getQueryToApply());
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
      var invalidSource = new carto.source.Dataset('invalid_dataset');
      var cartoCSS = new carto.style.CartoCSS('#layer { marker-fill: red; }');

      invalidSource.on('error', function (cartoError) {
        expect(cartoError.message).toMatch(/Invalid dataset name used. Dataset "invalid_dataset" does not exist./);
        done();
      });
      var layer = new carto.layer.Layer(invalidSource, cartoCSS);

      client.addLayer(layer).catch(function () { }); // Prevent console "uncaught error" warning.
    });
  });
});
