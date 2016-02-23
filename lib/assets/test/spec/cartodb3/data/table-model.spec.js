var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');

describe('data/table-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new TableModel({
      id: 'abc-123',
      name: 'foobar_table'
    }, {
      configModel: configModel
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/tables/foobar_table');
  });

  it('should provide means for a custom URL for columns collection', function () {
    expect(this.model.columnsCollection.url()).toEqual('/u/pepe/api/v1/tables/foobar_table/columns');
  });
});
