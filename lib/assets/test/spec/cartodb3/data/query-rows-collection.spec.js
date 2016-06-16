// var _ = require('underscore');
var Backbone = require('backbone');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');
// var QueryRowModel = require('../../../../javascripts/cartodb3/data/query-row-model');
var QueryRowsCollection = require('../../../../javascripts/cartodb3/data/query-rows-collection');

describe('data/query-rows-collection', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();

    this.querySchemaModel = new QuerySchemaModel({}, {
      configModel: this.configModel
    });

    spyOn(QueryRowsCollection.prototype, 'fetch');
    this.collection = new QueryRowsCollection([], {
      querySchemaModel: this.querySchemaModel,
      configModel: this.configModel
    });
  });
});
