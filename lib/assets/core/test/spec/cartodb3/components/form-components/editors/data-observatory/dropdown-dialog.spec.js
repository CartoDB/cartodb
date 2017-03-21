var Backbone = require('backbone');
var cdb = require('cartodb.js');
var DropdownDialogView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/dropdown-dialog-view');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var MeasurementsCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurements-collection');
var FiltersCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurements-filters-collection');

describe('components/form-components/editors/data-observatory/dropdown-dialog-view', function () {
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

    this.view = new DropdownDialogView({
      measurements: this.measurements,
      filters: this.filters
    });

    spyOn(this.view, '_createListView').and.callThrough();
    spyOn(this.view, '_createFilterView').and.callThrough();

    this.view.render();
  });

  it('should genereate an measurements and filters collections', function () {
    expect(this.view._measurements).toBeDefined();
    expect(this.view._filters).toBeDefined();
    expect(this.view._measurements.size()).toBe(3);
  });

  it('should render properly', function () {
    expect(this.view._stackLayoutView).toBeDefined();
    expect(this.view._createListView).toHaveBeenCalled();
  });

  it('should react to visibility changes', function () {
    spyOn(this.view, 'clearSubViews').and.callThrough();
    spyOn(this.view, '_generateStackLayoutView');

    this.view.model.set('visible', true);
    expect(this.view.clearSubViews).toHaveBeenCalled();
    expect(this.view._generateStackLayoutView).toHaveBeenCalled();

    this.view.clearSubViews.calls.reset();
    this.view._generateStackLayoutView.calls.reset();
    this.view.model.set('visible', false);

    expect(this.view.clearSubViews).toHaveBeenCalled();
    expect(this.view._generateStackLayoutView).not.toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
  });
});
