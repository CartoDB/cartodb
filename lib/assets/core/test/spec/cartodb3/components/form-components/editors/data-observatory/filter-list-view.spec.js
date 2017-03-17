var Backbone = require('backbone');
var cdb = require('cartodb.js');

var FilterListView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/filter-list-view');
var FiltersCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurements-filters-collection');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');

fdescribe('components/form-components/editors/data-observatory/filter-list-view', function () {
  beforeEach(function () {
    cdb.SQL.prototype.execute = function (query, vars, params) {
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

    this.filters = new FiltersCollection([], {
      configModel: configModel,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.filters.fetch();

    this.view = new FilterListView({
      filters: this.filters
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view._listView).toBeDefined();
    expect(this.view.$('.js-back').length).toBe(1);
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
