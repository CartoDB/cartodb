var Backbone = require('backbone');
var TimeSpanCollection = require('builder/data/data-observatory/timespan-collection');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');

describe('data/data-observatory/timespan-collection', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      base_url: '/u/foo',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    this.nodeDefModel = new AnalysisDefinitionNodeModel({
      id: 'a1',
      type: 'data-observatory-multiple-measures',
      final_column: 'foo',
      source: 'a0'
    }, {
      configModel: configModel,
      collection: new Backbone.Collection()
    });

    this.querySchemaModel = new Backbone.Model({
      query: 'select * from wadus'
    });

    this.nodeDefModel.querySchemaModel = this.querySchemaModel;

    this.collection = new TimeSpanCollection([], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    spyOn(this.collection.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [
          {
            timespan_id: '2010',
            timespan_name: '2010'
          },
          {
            timespan_id: '2015',
            timespan_name: '2015'
          },
          {
            timespan_id: '2017',
            timespan_name: '2017'
          }
        ]
      });
    });

    this.successCallback = jasmine.createSpy('successCallback');
    this.errorCallback = jasmine.createSpy('errorCallback');
  });

  it('initial state', function () {
    expect(this.collection.getState()).toBe('unfetched');
  });

  it('fetch', function () {
    this.collection.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    expect(this.successCallback).toHaveBeenCalled();
    expect(this.collection.length).toBe(3);
    expect(this.collection.getState()).toBe('fetched');
  });

  it('first timespan as default', function () {
    this.collection.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    this.collection.selectFirstAsDefault();
    expect(this.collection.getSelectedItem().getValue()).toBe('2010');
  });

  it('should not select the first item if empty', function () {
    this.collection.SQL.execute.and.callFake(function (query, vars, params) {
      params && params.success({
        rows: []
      });
    });

    this.collection.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    this.collection.selectFirstAsDefault();
    expect(this.collection.getSelectedItem()).toBeUndefined();
  });
});
