var Backbone = require('backbone');
var LazySearchCollection = require('builder/components/form-components/editors/lazy-select/lazy-search-collection');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');

describe('components/form-components/editors/lazy-select/lazy-search-collection', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      base_url: '/u/foo',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a1',
      source: 'a0'
    }, {
      configModel: configModel,
      collection: new Backbone.Collection()
    });

    this.querySchemaModel = new Backbone.Model({
      query: 'select * from wadus'
    });

    this.nodeDefModel.querySchemaModel = this.querySchemaModel;

    var model = new Backbone.Model({
      name: 'foo'
    });

    this.collection = new LazySearchCollection([], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel,
      rowModel: model,
      column: 'name'
    });

    spyOn(this.collection.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [
          {
            name: 'foo'
          },
          {
            name: 'bar'
          },
          {
            name: 'carto'
          }
        ]
      });
    });
  });

  it('initial state', function () {
    expect(this.collection.getState()).toBe('empty');
  });

  it('fetch', function () {
    this.collection.fetch();

    expect(this.collection.length).toBe(3);
    expect(this.collection.getState()).toBe('fetched');
  });

  it('model', function () {
    this.collection.fetch();

    var m = this.collection.at(0);
    expect(m.getValue()).toBe('foo');
    expect(m.getName()).toBe('foo');
  });

  it('getSelected', function () {
    this.collection.fetch();

    var m = this.collection.at(0);
    this.collection.setSelected(m.getValue());

    var selected = this.collection.getSelectedItem();
    expect(selected.getValue()).toBe(m.getValue());
  });
});
