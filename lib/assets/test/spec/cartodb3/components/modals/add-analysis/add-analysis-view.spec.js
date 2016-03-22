var cdb = require('cartodb.js');
var Backbone = require('backbone');
var AddAnalysisView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');
var AnalysisDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definitions-collection');

describe('components/modals/add-analysis/add-analysis-view', function () {
  var FETCHING_TITLE = 'fetching-';

  beforeEach(function () {
    this.modalModel = new cdb.core.Model();
    spyOn(this.modalModel, 'destroy');

    this.analysisDefinitionNodeModel = new cdb.core.Model({
      id: 'a0',
      type: 'source',
      query: 'SELECT * FROM foo'
    });

    this.layerDefinitionModel = new cdb.core.Model();
    this.layerDefinitionModel.sync = function () {};
    this.analysisDefinitionsCollection = new AnalysisDefinitionsCollection(null, {
      configModel: {},
      analysis: {},
      vizId: 'viz-123'
    });
    spyOn(this.analysisDefinitionsCollection, 'createNode');

    this.view = new AddAnalysisView({
      modalModel: this.modalModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the content view', function () {
    expect(this.view.$('.js-body').html()).not.toContain(FETCHING_TITLE);
  });

  describe('when click add', function () {
    it('should do nothing if there is no selection', function () {
      this.view.$('.js-add').click();
      expect(this.modalModel.destroy).not.toHaveBeenCalled();
    });
  });

  describe('when an option is selected', function () {
    beforeEach(function () {
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(true);
      this.view.$('li').click();
    });

    it('should enable add-button', function () {
      expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(false);
    });

    describe('when click add', function () {
      beforeEach(function () {
        this.analysisDefinitionsCollection.createNode.and.returnValue({
          id: 'a1'
        });
        this.view.$('.js-add').click();
      });

      describe('when node is created', function () {
        beforeEach(function () {
          this.analysisDefinitionsCollection.createNode.calls.argsFor(0)[1].success();
        });

        it('should save the new node as source for related layer', function () {
          expect(this.layerDefinitionModel.get('source')).toEqual('a1');
        });
      });
    });
  });
});
