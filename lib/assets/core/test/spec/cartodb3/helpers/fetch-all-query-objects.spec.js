var Backbone = require('backbone');
var fetchAllQueryObjectsIfNecessary = require('../../../../javascripts/cartodb3/helpers/fetch-all-query-objects');

describe('helpers/fetch-all-query-objects', function () {
  describe('repeated errors', function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*'))
        .andReturn({status: 429, responseText: '{"error":["You are over platform\'s limits. Please contact us to know more details"]}'});

      spyOn(Backbone.Model.prototype, 'fetch');
    });

    it('all errored should call callback', function () {
      var callback = jasmine.createSpy('callback');
      var querySchemaModel = jasmine.createSpyObj('querySchemaModel', ['fetch', 'hasRepeatedErrors', 'isFetched', 'shouldFetch']);
      var queryGeometryModel = jasmine.createSpyObj('queryGeometryModel', ['fetch', 'hasRepeatedErrors', 'isFetched', 'shouldFetch']);
      var queryRowsCollection = jasmine.createSpyObj('queryRowsCollection', ['fetch', 'hasRepeatedErrors', 'isFetched', 'shouldFetch', 'size']);

      querySchemaModel.shouldFetch.and.returnValue(false);
      queryGeometryModel.shouldFetch.and.returnValue(false);
      queryRowsCollection.shouldFetch.and.returnValue(false);
      queryRowsCollection.size.and.returnValue(0);
      querySchemaModel.hasRepeatedErrors.and.returnValue(true);

      fetchAllQueryObjectsIfNecessary({
        queryRowsCollection: queryRowsCollection,
        queryGeometryModel: queryGeometryModel,
        querySchemaModel: querySchemaModel
      }, callback);

      expect(callback).toHaveBeenCalled();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });
  });
});
