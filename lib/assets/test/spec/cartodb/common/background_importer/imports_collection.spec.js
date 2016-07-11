var ImportsCollection = require('../../../../../javascripts/cartodb/common/background_polling/models/imports_collection');

describe('common/background_polling/imports_collection', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.carto.com'
    });

    this.collection = new ImportsCollection(undefined, {
      user: this.user
    });
  });

  describe('.failedItems', function() {
    it('should return the failed items', function() {
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
