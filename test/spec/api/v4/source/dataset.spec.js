var carto = require('../../../../../src/api/v4');

fdescribe('api/v4/source/dataset', function () {
  describe('constructor', function () {
    it('should return a new Dataset object', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      expect(populatedPlacesDataset).toBeDefined();
    });

    it('should autogenerate an id when no ID is given', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      expect(populatedPlacesDataset._id).toBeDefined();
    });

    it('should assign the given id', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple', { id: 'datasetID' });
      expect(populatedPlacesDataset._id).toEqual('datasetID');
    });
  });

  describe('$setEngine', function () {
    it('should create an internal model with the dataset and the engine', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple', { id: 'a0' });

      populatedPlacesDataset.$setEngine('fakeEngine');

      var internalModel = populatedPlacesDataset.$getInternalModel();
      expect(internalModel.get('id')).toEqual('a0');
      expect(internalModel.get('query')).toEqual('SELECT * from ne_10m_populated_places_simple');
      expect(internalModel._engine).toEqual('fakeEngine');
    });
  });
});
