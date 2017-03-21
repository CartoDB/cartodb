var Backbone = require('backbone');
var cdb = require('cartodb.js');

var MeasurementsCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurements-collection');
var MeasurementListView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurement-list-view');
var FiltersCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurements-filters-collection');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');

describe('components/form-components/editors/data-observatory/measurement-list-view', function () {
  beforeEach(function () {
    cdb.SQL.prototype.execute = function (query, vars, params) {
      var payload;

      if (/numers.numer_tags/.test(query)) {
        payload = {
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
      } else {
        payload = {
          rows: [
            {
              numer_id: 'us.zillow.AllHomes_Zhvi',
              numer_name: 'Zillow Home Value Index for All homes',
              numer_tags: '{"subsection/tags.housing": "Housing", "license/us.zillow.zillow-license": "Zillow Terms of Use for Aggregate Data", "subsection/us.census.acs.segments": "US Population Segments"}'
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
      }
      params && params.success(payload);
    };

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

    this.model = new Backbone.Model({
      measurements: 'us.census.acs.B01001002'
    });

    this.measurementsCollection = new MeasurementsCollection([], {
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.filtersCollection = new FiltersCollection([], {
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.measurementsCollection.fetch();
    this.filtersCollection.fetch();

    this.view = new MeasurementListView({
      measurementsCollection: this.measurementsCollection,
      filtersCollection: this.filtersCollection
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view._listView).toBeDefined();
    expect(this.view.$('.js-filters').length).toBe(1);
  });

  it('should render filtered measurements', function () {
    this.filtersCollection.setSelected('subsection/tags.age_gender');
    this.view = new MeasurementListView({
      measurementsCollection: this.measurementsCollection,
      filtersCollection: this.filtersCollection
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
