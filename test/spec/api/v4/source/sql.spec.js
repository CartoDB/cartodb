var carto = require('../../../../../src/api/v4');

fdescribe('api/v4/source/dataset', function () {
  describe('constructor', function () {
    it('should return a new Dataset object', function () {
      var sqlDataset = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = \'Spain\'');
      expect(sqlDataset).toBeDefined();
    });

    it('should autogenerate an id when no ID is given', function () {
      var sqlDataset = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = \'Spain\'');
      expect(sqlDataset._id).toBeDefined();
    });

    it('should assign the given id', function () {
      var sqlDataset = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = \'Spain\'', { id: 'sql0' });
      expect(sqlDataset._id).toEqual('sql0');
    });
  });

  describe('$setEngine', function () {
    it('should create an internal model with the dataset attrs and the engine', function () {
      var sqlDataset = new carto.source.SQL('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = \'Spain\'', { id: 'sql0' });

      sqlDataset.$setEngine('fakeEngine');

      var internalModel = sqlDataset.$getInternalModel();
      expect(internalModel.get('id')).toEqual('sql0');
      expect(internalModel.get('query')).toEqual('SELECT * FROM ne_10m_populated_places_simple WHERE adm0name = \'Spain\'');
      expect(internalModel._engine).toEqual('fakeEngine');
    });
  });
});
