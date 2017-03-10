var ImportsCollection = require('../../../../../javascripts/cartodb3/data/background-importer/background-importer-imports-collection.js');
var ImportsModel = require('../../../../../javascripts/cartodb3/data/background-importer/imports-model.js');
var UserModel = require('../../../../../javascripts/cartodb3/data/user-model');
var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');

describe('common/background-polling/imports-collection', function () {
  beforeEach(function () {
    this.userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: 'c'
    });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.collection = new ImportsCollection(undefined, {
      userModel: this.userModel,
      configModel: this.configModel
    });
  });

  it('should generate the right URL', function () {
    expect(this.collection.url()).toBe('/u/pepe/api/v1/imports');
  });

  describe('.failedItems', function () {
    it('should return the failed items', function () {
      expect(this.collection.failedItems()).toEqual([]);

      var importModel = new ImportsModel({}, {
        userModel: this.userModel,
        configModel: {}
      });

      var importModel2 = new ImportsModel({
        state: 'failure',
        step: 'import'
      }, {
        userModel: this.userModel,
        configModel: {}
      });

      // Add three of which one is failed
      this.collection.reset([importModel, importModel2]);

      expect(this.collection.failedItems().length).toEqual(1);
    });
  });
});
