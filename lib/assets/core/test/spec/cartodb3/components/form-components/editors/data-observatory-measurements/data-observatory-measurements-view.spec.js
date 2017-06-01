var Backbone = require('backbone');
var _ = require('underscore');
var cdb = require('cartodb.js');
var AnalysisDefinitionNodeModel = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');

describe('components/form-components/editors/data-observatory-measurements/data-observatory-measurements-view', function () {
  var sqlExecuteBackup = cdb.SQL.prototype.execute;

  var createViewFn = function (options) {
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

    this.model = new Backbone.Model({
      measurements: 'us.census.acs.B01001002'
    });

    var defaultOptions = {
      key: 'measurements',
      model: this.model,
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    };

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

    this.view = new Backbone.Form.editors.DataObservatoryDropdown(_.extend(defaultOptions, options));
    this.view.render();
    this.dialog = this.view._dialogView;
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  it('should genereate an measurements and filters collections if not passed as options', function () {
    this.createView();

    expect(this.view.measurementsCollection).toBeDefined();
    expect(this.view.measurementsCollection.size()).toBe(3);
  });

  describe('render', function () {
    it('should render properly', function () {
      this.createView();

      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('Male Population');
    });

    it('should render selected item', function () {
      this.createView();
      this.view.measurementsCollection.getItem('us.census.acs.B19083001').set({ selected: true });

      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('Gini Index');
    });

    it('should render custom placeholder if provided and no selected', function () {
      this.createView({
        placeholder: 'wadus'
      });

      this.model.set('measurements', '');
      this.view.render();

      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('wadus');
    });

    it('should disable the component if option is true', function () {
      this.createView();
      this.view.options.disabled = true;
      this.view.render();

      expect(this.view.$('.js-button').hasClass('is-disabled')).toBeTruthy();
    });

    it('should add is-empty class if there is no value selected', function () {
      this.createView();

      this.model.set('measurements', '');
      this.view.render();
      expect(this.view.$('.js-button').hasClass('is-empty')).toBeTruthy();
    });
  });

  it('should change button value and hide dialog when a new item is selected', function () {
    this.createView();
    spyOn(this.dialog, 'hide');
    this.view.measurementsCollection.getItem('us.zillow.AllHomes_Zhvi').set({ selected: true });
    expect(this.view.$('.js-button').text()).toContain('Zillow Home Value Index for All homes');
    expect(this.view.$('.js-button').hasClass('is-empty')).toBeFalsy();
    expect(this.dialog.hide).toHaveBeenCalled();
  });

  it('should open dialog if "button" is clicked', function () {
    this.createView();
    spyOn(this.dialog, 'toggle');
    this.view.$('.js-button').trigger('click');
    expect(this.dialog.toggle).toHaveBeenCalled();
  });

  it('should destroy dialog when element is removed', function () {
    this.createView();
    spyOn(this.dialog, 'clean');
    this.view.remove();
    expect(this.dialog.clean).toHaveBeenCalled();
  });

  afterEach(function () {
    cdb.SQL.prototype.execute = sqlExecuteBackup;
    this.view.remove();
  });
});
