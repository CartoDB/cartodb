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

      if (/numers/.test(query)) {
        payload = {
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
        };
      } else {
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

    this.measurements = new MeasurementsCollection([], {
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.filters = new FiltersCollection([], {
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.measurements.fetch();
    this.filters.fetch();

    this.view = new MeasurementListView({
      measurements: this.measurements,
      filters: this.filters
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view._listView).toBeDefined();
    expect(this.view.$('.js-filters').length).toBe(1);
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
