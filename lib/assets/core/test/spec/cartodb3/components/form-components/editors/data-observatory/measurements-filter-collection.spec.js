var Backbone = require('backbone');
var _ = require('underscore');
var FilterCollection = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory/measurements-filters-collection');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var cdb = require('cartodb.js');

fdescribe('components/form-components/editors/data-observatory/measurements-filters-collection', function () {
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
      });
    };

    this.collection = new FilterCollection([], {
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
    expect(this.collection.length).toBe(4);
    expect(this.collection.getState()).toBe('fetched');
  });

  it('model', function () {
    this.collection.fetch({
      success: this.successCallback,
      error: this.errorCallback
    });

    var m = this.collection.at(0);
    expect(m.get('id')).toBe('subsection/tags.age_gender');
    expect(m.get('name')).toBe('Age and Gender');
  });

  describe('setSelected', function () {
    beforeEach(function () {
      this.collection.fetch();
    });

    it('single value', function () {
      this.collection.setSelected('subsection/us.zillow.indexes');
      expect(this.collection.at(3).get('selected')).toBe(true);
    });

    it('multiple value', function () {
      this.collection.setSelected(['subsection/tags.age_gender', 'subsection/us.zillow.indexes']);
      expect(this.collection.at(0).get('selected')).toBe(true);
      expect(this.collection.at(3).get('selected')).toBe(true);
    });
  });

  it('getSelected', function () {
    this.collection.fetch();
    this.collection.setSelected(['subsection/tags.age_gender', 'subsection/us.zillow.indexes']);
    var selected = this.collection.getSelected();

    expect(_.every(selected, function (mdl) {
      return mdl.get('selected') === true;
    })).toBe(true);
  });
});
