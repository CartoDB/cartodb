var Backbone = require('backbone');
var cdb = require('cartodb.js');
var MeasurementsCollection = require('../../../../../../../javascripts/cartodb3/data/data-observatory/measurements-collection');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var DataObservatoryListView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory-measurements/measurements-list-view');

describe('components/form-components/editors/data-observatory-measurements/measurements-list-view', function () {
  beforeEach(function () {
    cdb.SQL.prototype.execute = function (query, vars, params) {
      var payload = {
        rows: [
          {
            numer_id: 'us.zillow.AllHomes_Zhvi',
            numer_name: 'Zillow Home Value Index for All homes',
            numer_tags: '{"subsection/tags.housing": "Housing", "license/us.zillow.zillow-license": "Zillow Terms of Use for Aggregate Data"}'
          },
          {
            numer_id: 'us.census.acs.B19083001',
            numer_name: 'Gini Index',
            numer_tags: '{"subsection/tags.age_gender": "Age and Gender", "license/tags.no-restrictions": "Unrestricted"}'
          },
          {
            numer_id: 'us.census.acs.B01001002',
            numer_name: 'Male Population',
            numer_tags: '{"subsection/tags.age_gender": "Age and Gender", "license/tags.no-restrictions": "Unrestricted"}'
          }
        ]
      };
      params && params.success(payload);
    };

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

    this.measurementsCollection = new MeasurementsCollection([], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    this.measurementsCollection.fetch();

    this.view = new DataObservatoryListView({
      measurementsCollection: this.measurementsCollection
    });

    spyOn(this.view, '_createListView').and.callThrough();
    spyOn(this.view, '_createSearchView').and.callThrough();
    spyOn(this.view, '_createCountView').and.callThrough();

    this.view.render();
  });

  it('should genereate an measurements and filters collections', function () {
    expect(this.view._measurementsCollection).toBeDefined();
    expect(this.view.collection).toBeDefined();
    expect(this.view._measurementsCollection.size()).toBe(3);
    expect(this.view.collection.size()).toBe(3);
  });

  it('should render properly', function () {
    expect(this.view._listView).toBeDefined();
    expect(this.view._createListView).toHaveBeenCalled();
    expect(this.view._createSearchView).toHaveBeenCalled();
    expect(this.view._createCountView).toHaveBeenCalled();
  });

  it('should filter search queries', function () {
    this.view.model.set('query', 'pop');

    expect(this.view._measurementsCollection.size()).toBe(3);
    expect(this.view.collection.size()).toBe(1);
    expect(this.view.model.get('items')).toBe(1);
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
