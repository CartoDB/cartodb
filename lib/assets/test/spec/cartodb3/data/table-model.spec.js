var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');

describe('data/table-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel();
    this.model = new TableModel({
      id: 'abc-123',
      name: 'foobar_table'
    }, {
      baseUrl: '/users/pepe',
      configModel: configModel
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.model.url()).toEqual('/users/pepe/api/v1/tables/foobar_table');
  });

  it('should provide means for a custom URL for columns collection', function () {
    expect(this.model.columnsCollection.url()).toEqual('/users/pepe/api/v1/tables/foobar_table/columns');
  });
});
