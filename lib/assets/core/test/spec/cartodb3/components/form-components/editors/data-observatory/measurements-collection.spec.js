var Backbone = require('backbone');
var cdb = require('cartodb.js');
var MeasurementsCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurements-collection');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');

describe('components/form-components/editors/data-observatory/measurements-collection', function () {
  beforeEach(function () {
    var configModel = new Backbone.Model({
      base_url: '/u/foo',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l1',
      options: {
        type: 'CartoDB',
        table_name: 'wadus'
      }
    }, {
      parse: true,
      configModel: configModel
    });

    this.querySchemaModel = new Backbone.Model({
      query: 'select * from wadus'
    });

    var sourceNode = new Backbone.Model({
      type: 'source',
      table_name: 'wadus'
    });
    sourceNode.querySchemaModel = this.querySchemaModel;

    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(sourceNode);

    cdb.SQL.prototype.execute = function (query, vars, params) {
      params && params.success({
        rows: [
          {
            numer_id: 'us.zillow.AllHomes_Zhvi',
            numer_name: 'Zillow Home Value Index for All homes',
            numer_tags: '{"subsection/tags.housing": "Housing", "license/us.zillow.zillow-license": "Zillow Terms of Use for Aggregate Data"}'
          },
          {
            numer_id: 'us.census.acs.B19083001',
            numer_name: 'Gini Index',
            numer_tags: '{"subsection/tags.income": "Income", "section/tags.united_states": "United States", "license/tags.no-restrictions": "Unrestricted"}'
          },
          {
            numer_id: 'us.census.acs.B01001002',
            numer_name: 'Male Population',
            numer_tags: '{"section/tags.united_states": "United States", "subsection/tags.age_gender": "Age and Gender", "license/tags.no-restrictions": "Unrestricted"}'
          }
        ]
      });
    };

    this.collection = new MeasurementsCollection([], {
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel
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

  it('model', function () {
    this.collection.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    var m = this.collection.at(0);
    expect(m.getValue()).toBe('us.zillow.AllHomes_Zhvi');
    expect(m.getName()).toBe('Zillow Home Value Index for All homes');
    expect(m.get('filter')).toEqual({
      id: 'subsection/tags.housing',
      name: 'Housing'
    });
    expect(m.get('license')).toBe('Zillow Terms of Use for Aggregate Data');
  });
});
