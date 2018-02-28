var Backbone = require('backbone');
var DataObservatoryColumnName = require('builder/data/data-observatory/column-name');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');

describe('data/data-observatory/column-name', function () {
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

    this.columnName = new DataObservatoryColumnName({
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    spyOn(this.columnName.SQL, 'execute').and.callFake(function (query, vars, params) {
      params && params.success({
        rows: [
          {
            obs_getmeta: [{
              suggested_name: 'commuters_16_over_per_sq_km_2010_2014'
            }]
          }
        ]
      });
    });

    this.successCallback = jasmine.createSpy('successCallback');
  });

  it('initial fetch state', function () {
    expect(this.columnName.isFetching).toBe(false);
  });

  describe('fetch', function () {
    it('fetch without numer_id', function () {
      this.columnName.fetch({
        success: this.successCallback
      });

      expect(this.successCallback).not.toHaveBeenCalled();
    });

    it('fetch with numer_id', function () {
      this.columnName.fetch({
        numer_id: 1,
        success: this.successCallback
      });

      expect(this.successCallback).toHaveBeenCalledWith({
        rows: [
          {
            obs_getmeta: [{
              suggested_name: 'commuters_16_over_per_sq_km_2010_2014'
            }]
          }
        ]
      });
    });
  });

  it('buildQueryOptions', function () {
    var options = this.columnName.buildQueryOptions({
      key: 'foo'
    });

    expect(options).toEqual(jasmine.objectContaining({
      metadata: "'[" + JSON.stringify({key: 'foo'}) + "]'",
      query: 'select * from wadus'
    }));
  });
});
