var Backbone = require('backbone');
var _ = require('underscore');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var MeasurementModel = require('builder/data/data-observatory/measurement-model');

describe('components/form-components/editors/data-observatory-measurements/data-observatory-measurements-view', function () {
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

    this.measurementModel = new MeasurementModel({}, {
      configModel: configModel,
      nodeDefModel: this.nodeDefModel
    });

    var defaultOptions = {
      key: 'measurements',
      model: this.model,
      configModel: configModel,
      nodeDefModel: this.nodeDefModel,
      measurementModel: this.measurementModel,
      region: 'wadus'
    };

    this.view = new Backbone.Form.editors.DataObservatoryDropdown(_.extend(defaultOptions, options));
    this.view.render();
    this.dialog = this.view._dialogView;

    spyOn(this.view.filtersCollection.SQL, 'execute').and.callFake(function (query, vars, params) {
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

    spyOn(this.view.measurementsCollection.SQL, 'execute').and.callFake(function (query, vars, params) {
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
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  it('should genereate an measurements and filters collections', function () {
    this.createView();

    expect(this.view.measurementsCollection).toBeDefined();
    expect(this.view.filtersCollection).toBeDefined();
  });

  describe('render', function () {
    it('should render properly', function () {
      this.createView();

      this.view.measurementsCollection.fetch();
      this.view.measurementsCollection.getItem('us.census.acs.B01001002').set({ selected: true });

      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('Male Population');
      expect(this.view.$('.js-button').attr('title')).toBe('Male Population');

      this.view.measurementsCollection.getItem('us.census.acs.B19083001').set({ selected: true });
      expect(this.view.$('.js-button').text()).toContain('Gini Index');
      expect(this.view.$('.js-button').attr('title')).toBe('Gini Index');
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

      this.view.render();
      expect(this.view.$('.js-button').hasClass('is-empty')).toBeTruthy();
    });
  });

  describe('getValue', function () {
    it('should return item selected if any', function () {
      this.createView();

      this.view.measurementsCollection.fetch();
      this.view.measurementsCollection.getItem('us.zillow.AllHomes_Zhvi').set({ selected: true });
      var value = this.view.getValue();
      expect(value).toBe('us.zillow.AllHomes_Zhvi');
    });

    it('should return value if no item selected', function () {
      this.createView();

      this.measurementModel.set({
        val: 'us.census.acs.B01001002'
      });

      var value = this.view.getValue();
      expect(value).toBe('us.census.acs.B01001002');
    });
  });

  it('should change button value and hide dialog when a new item is selected', function () {
    this.createView();
    spyOn(this.dialog, 'hide');

    this.view.measurementsCollection.fetch();
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
    this.view.remove();
  });
});
