var Backbone = require('backbone');
var _ = require('underscore');
var FilterCollection = require('../../../../../javascripts/cartodb3/data/data-observatory/filters-collection');
var AnalysisDefinitionNodeModel = require('../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var cdb = require('cartodb.js');

describe('data/data-observatory/filters-collection', function () {
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
      nodeDefModel: this.nodeDefModel
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
    expect(m.getValue()).toBe('subsection/tags.age_gender');
    expect(m.getName()).toBe('Age and Gender');
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
