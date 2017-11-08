var carto = require('../../../../../src/api/v4');

describe('api/v4/source/dataset', function () {
  describe('constructor', function () {
    it('should return a new Dataset object', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      expect(populatedPlacesDataset).toBeDefined();
    });

    it('should autogenerate an id when no ID is given', function () {
      var populatedPlacesDataset = new carto.source.Dataset('ne_10m_populated_places_simple');
      expect(populatedPlacesDataset.getId()).toMatch(/S\d+/);
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
});
