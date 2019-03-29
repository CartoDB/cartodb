var fetchAllQueryObjects = require('builder/helpers/fetch-all-query-objects');
var getQuerySchemaModelFixture = require('fixtures/builder/query-schema-model.fixture.js');
var getQueryGeometryModelFixture = require('fixtures/builder/query-geometry-model.fixture.js');
var getQueryRowsCollectionFixture = require('fixtures/builder/query-rows-collection.fixture.js');
var ajaxFixtures = require('fixtures/builder/ajax-fixtures.js');

describe('helpers/fetch-all-query-objects', function () {
  describe('all models should fetch', function () {
    beforeEach(function () {
      jasmine.Ajax.install();

      jasmine.Ajax
        .stubRequest(ajaxFixtures.querySchemaModel.url.http)
        .andReturn(ajaxFixtures.querySchemaModel.response.ok);

      jasmine.Ajax
        .stubRequest(ajaxFixtures.queryGeometryModel.url.http)
        .andReturn(ajaxFixtures.queryGeometryModel.response.ok);

      jasmine.Ajax
        .stubRequest(ajaxFixtures.queryRowsCollection.url.http)
        .andReturn(ajaxFixtures.queryRowsCollection.response.ok);
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('every query model should fetch and resolve when they are in final status', function (done) {
      var CHECK_IT_PASSES = true;

      var querySchemaModel = getQuerySchemaModelFixture();
      var queryGeometryModel = getQueryGeometryModelFixture();
      var queryRowsCollection = getQueryRowsCollectionFixture({
        querySchemaModel: querySchemaModel
      });

      fetchAllQueryObjects({
        queryGeometryModel: queryGeometryModel,
        querySchemaModel: querySchemaModel,
        queryRowsCollection: queryRowsCollection
      }).then(function (values) {
        expect(CHECK_IT_PASSES).toBe(true);
        done();
      });

      querySchemaModel.trigger('inFinalStatus');
      queryGeometryModel.trigger('inFinalStatus');

      setTimeout(function () {
        queryRowsCollection.trigger('inFinalStatus');
      }, 0);
    });

    it('must resolve even when models are fetching', function (done) {
      var CHECK_IT_PASSES = true;

      var querySchemaModel = getQuerySchemaModelFixture({ initialStatus: 'fetching' });
      var queryGeometryModel = getQueryGeometryModelFixture({ initialStatus: 'fetching' });
      var queryRowsCollection = getQueryRowsCollectionFixture({
        querySchemaModel: querySchemaModel,
        initialStatus: 'fetching'
      });

      fetchAllQueryObjects({
        queryGeometryModel: queryGeometryModel,
        querySchemaModel: querySchemaModel,
        queryRowsCollection: queryRowsCollection
      }).then(function (values) {
        expect(CHECK_IT_PASSES).toBe(true);
        done();
      });

      queryGeometryModel.fetch();
      querySchemaModel.fetch();

      setTimeout(function () {
        queryRowsCollection.trigger('inFinalStatus');
      }, 0);
    });

    it('must resolve if the models are fetched', function (done) {
      var CHECK_IT_PASSES = true;

      var querySchemaModel = getQuerySchemaModelFixture({ initialStatus: 'fetched' });
      var queryGeometryModel = getQueryGeometryModelFixture({ initialStatus: 'fetched' });
      var queryRowsCollection = getQueryRowsCollectionFixture({
        querySchemaModel: querySchemaModel,
        initialStatus: 'fetched'
      });

      fetchAllQueryObjects({
        queryGeometryModel: queryGeometryModel,
        querySchemaModel: querySchemaModel,
        queryRowsCollection: queryRowsCollection
      }).then(function (values) {
        expect(CHECK_IT_PASSES).toBe(true);
        done();
      });
    });
  });
});
