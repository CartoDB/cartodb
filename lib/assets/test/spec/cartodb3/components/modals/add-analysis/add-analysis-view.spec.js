var cdb = require('cartodb.js');
var geometry = require('../../../../../../javascripts/cartodb3/data/geometry');
var AnalysisDefinitionNodeSourceModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-source-model');
var AddAnalysisView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');

describe('components/modals/add-analysis/add-analysis-view', function () {
  beforeEach(function () {
    this.modalModel = new cdb.core.Model();
    spyOn(this.modalModel, 'destroy');

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      id: 'a0',
      type: 'source',
      query: 'SELECT * from somewhere'
    }, {
      configModel: new cdb.core.Model(),
      collection: {}
    });
    this.querySchemaModel = this.analysisDefinitionNodeModel.querySchemaModel;
    this.querySchemaModel.set('query', 'SELECT * FROM something');
    spyOn(this.querySchemaModel, 'sync');
    spyOn(this.querySchemaModel, 'fetch').and.callThrough();

    this.view = new AddAnalysisView({
      modalModel: this.modalModel,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the loading view', function () {
    expect(this.view.$('.js-body').html()).toContain('loading');
  });

  describe('when geometry output type is fetched', function () {
    beforeEach(function () {
      spyOn(this.querySchemaModel, 'getGeometry').and.returnValue(geometry('0101000020110F00003BA22311223219C13E88B17EF7CA5241'));
      this.querySchemaModel.sync.calls.argsFor(0)[2].success({
        fields: {},
        rows: []
      });
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain('loading');
      expect(this.view.$('.js-body').html()).not.toContain('error');
    });

    describe('when click add when there is no selection', function () {
      it('should do nothing', function () {
        this.view.$('.js-add').click();
        expect(this.modalModel.destroy).not.toHaveBeenCalled();
      });
    });

    describe('when an option is selected', function () {
      beforeEach(function () {
        expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(true);
        this.view.$('li:first-child').click();
      });

      it('should enable add-button', function () {
        expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(false);
      });

      describe('when click add', function () {
        beforeEach(function () {
          this.view.$('.js-add').click();
        });

        it('should destroy the modal and pass the created node model', function () {
          expect(this.modalModel.destroy).toHaveBeenCalled();
          expect(this.modalModel.destroy.calls.argsFor(0)).toEqual([
            jasmine.objectContaining({
              id: 'a1',
              source: 'a0',
              type: jasmine.any(String)
            })
          ]);
        });
      });
    });
  });
});
