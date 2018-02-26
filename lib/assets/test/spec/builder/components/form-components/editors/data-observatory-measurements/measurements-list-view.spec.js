var Backbone = require('backbone');
var MeasurementsCollection = require('builder/data/data-observatory/measurements-collection');
var FiltersCollection = require('builder/data/data-observatory/filters-collection');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var DataObservatoryListView = require('builder/components/form-components/editors/data-observatory-measurements/measurements-list-view');
var MeasurementModel = require('builder/data/data-observatory/measurement-model');

describe('components/form-components/editors/data-observatory-measurements/measurements-list-view', function () {
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

    this.measurementsCollection = new MeasurementsCollection([], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    spyOn(this.measurementsCollection.SQL, 'execute').and.callFake(function (query, vars, params) {
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
    });

    this.filtersCollection = new FiltersCollection([], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    spyOn(this.filtersCollection.SQL, 'execute').and.callFake(function (query, vars, params) {
      var payload = {
        rows: [
          {
            subsection_id: 'subsection/tags.age_gender',
            subsection_name: 'Age and Gender'
          },
          {
            subsection_id: 'subsection/us.census.acs.segments',
            subsection_name: 'US Population Segments'
          },
          {
            subsection_id: 'subsection/tags.housing',
            subsection_name: 'Housing'
          },
          {
            subsection_id: 'subsection/us.zillow.indexes',
            subsection_name: 'Zillow Home Value and Rental Indexes'
          }
        ]
      };

      params && params.success(payload);
    });

    this.measurementsCollection.fetch();
    this.filtersCollection.fetch();

    this.searchMeasurements = jasmine.createSpy('searchMeasurements');

    this.measurementModel = new MeasurementModel({}, {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    this.view = new DataObservatoryListView({
      measurementsCollection: this.measurementsCollection,
      filtersCollection: this.filtersCollection,
      searchMeasurements: this.searchMeasurements,
      measurementModel: this.measurementModel
    });

    spyOn(this.view, '_createListView').and.callThrough();
    spyOn(this.view, '_createSearchView').and.callThrough();
    spyOn(this.view, '_createCountView').and.callThrough();

    this.view.render();
  });

  it('should genereate an measurements and filters collections', function () {
    expect(this.view._measurementsCollection).toBeDefined();
    expect(this.view._filtersCollection).toBeDefined();
    expect(this.view._measurementsCollection.size()).toBe(3);
    expect(this.view._filtersCollection.size()).toBe(4);
  });

  it('should render properly', function () {
    expect(this.view._listView).toBeDefined();
    expect(this.view._createListView).toHaveBeenCalled();
    expect(this.view._createSearchView).toHaveBeenCalled();
    expect(this.view._createCountView).toHaveBeenCalled();
  });

  it('should filter search queries', function () {
    this.view.model.set('query', 'pop');

    expect(this.searchMeasurements).toHaveBeenCalled();
  });

  it('should render filtered measurements', function () {
    this.measurementsCollection.SQL.execute = function (query, vars, params) {
      var payload = {
        rows: [
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

    this.filtersCollection.setSelected('subsection/tags.age_gender');
    this.measurementsCollection.fetch();

    this.view = new DataObservatoryListView({
      measurementsCollection: this.measurementsCollection,
      filtersCollection: this.filtersCollection,
      searchMeasurements: this.searchMeasurements,
      measurementModel: this.measurementModel
    });

    this.view.render();

    expect(this.view.$('.js-listItem').length).toBe(2);
    expect(this.view.$('.js-listItem').eq(0).text()).toContain('Gini Index');
    expect(this.view.$('.js-listItem').eq(1).text()).toContain('Male Population');
  });

  it('should trigger filter event', function () {
    spyOn(this.view, 'trigger');
    this.view.$('.js-filters').click();

    expect(this.view.trigger).toHaveBeenCalledWith('filters');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
