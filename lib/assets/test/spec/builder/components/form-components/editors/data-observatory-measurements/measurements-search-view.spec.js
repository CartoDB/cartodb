var Backbone = require('backbone');
var DataObservatorySearchView = require('builder/components/form-components/editors/data-observatory-measurements/measurements-search-view');
var FiltersCollection = require('builder/data/data-observatory/filters-collection');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');

describe('components/form-components/editors/data-observatory-measurements/measurements-search-view', function () {
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

    this.filtersCollection = new FiltersCollection([
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
    ], {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    this.model = new Backbone.Model({
      query: '',
      items: 50,
      fetching: false
    });

    this.view = new DataObservatorySearchView({
      model: this.model,
      filtersCollection: this.filtersCollection
    });
  });

  it('should sanitize input', function () {
    this.view.$('.js-input-search').val('<script>');
    expect(this.model.get('query')).toBe('');
  });

  describe('render', function () {
    it('label with no filter selected', function () {
      this.view.render();

      expect(this.view.$('.js-filters').text()).toContain('analyses.data-observatory-measure.filters.label');
    });

    it('label with 1 filter selected', function () {
      this.filtersCollection.at(0).set({selected: true});
      this.view.render();

      expect(this.view.$('.js-filters').text()).toContain('analyses.data-observatory-measure.filters.applied.single');
    });

    it('label with more than one filter selected', function () {
      this.filtersCollection.at(0).set({selected: true});
      this.filtersCollection.at(2).set({selected: true});
      this.view.render();

      expect(this.view.$('.js-filters').text()).toContain('analyses.data-observatory-measure.filters.applied.multiple');
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
