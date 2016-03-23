var cdb = require('cartodb.js');
var AddAnalysisView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');

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

    this.layerDefinitionModel = new LayerDefinitionModel({}, {
      configModel: {}
    });
    spyOn(this.layerDefinitionModel, 'createNewAnalysisNode');

    this.view = new AddAnalysisView({
      modalModel: this.modalModel,
      layerDefinitionModel: this.layerDefinitionModel,
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
        this.view.$('.js-add').click();
      });

      it('should create a new analysis node', function () {
        expect(this.layerDefinitionModel.createNewAnalysisNode).toHaveBeenCalled();
        expect(this.layerDefinitionModel.createNewAnalysisNode.calls.argsFor(0)[0]).toEqual(jasmine.any(Object));
      });
    });
  });
});
