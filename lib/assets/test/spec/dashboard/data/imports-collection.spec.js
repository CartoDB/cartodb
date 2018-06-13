const ImportsCollection = require('dashboard/data/imports-collection');
const userFixture = require('fixtures/dashboard/user-model.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/imports-collection', function () {
  beforeEach(function () {
    this.user = userFixture({
      username: 'pepe',
      base_url: 'http://pepe.carto.com'
    });

    this.collection = new ImportsCollection(undefined, {
      userModel: this.user,
      configModel
    });
  });

  describe('.failedItems', function () {
    it('should return the failed items', function () {
      expect(this.collection.failedItems()).toEqual([]);

      // Add three of which one is failed
      this.collection.reset([{
      }, {
        state: 'failure',
        step: 'import'
      }, {
      }]);
      expect(this.collection.failedItems().length).toEqual(1);
    });
  });
});
