var cdb = require('cartodb-deep-insights.js');
var Config = require('../../../../javascripts/cartodb3/top-level-apis/config');
var TableModel = require('../../../../javascripts/cartodb3/data-models/table-model');

describe('data-models/table-model', function () {
  beforeEach(function () {
    cdb.config = new Config();
    this.model = new TableModel({
      id: 'abc-123',
      name: 'foobar_table'
    }, {
      baseUrl: '/users/pepe'
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.model.url()).toEqual('/users/pepe/api/v1/tables/foobar_table');
  });
});
