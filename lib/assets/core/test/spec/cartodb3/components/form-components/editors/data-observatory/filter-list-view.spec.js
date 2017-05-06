var Backbone = require('backbone');
var cdb = require('cartodb.js');

var FilterListView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/filter-list-view');
var FiltersCollection = require('../../../../../../../javascripts/cartodb3/data/data-observatory/filters-collection');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('components/form-components/editors/data-observatory/filter-list-view', function () {
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

    this.filtersCollection = new FiltersCollection([], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    this.filtersCollection.fetch();

    this.view = new FilterListView({
      filtersCollection: this.filtersCollection
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
