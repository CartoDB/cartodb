var Backbone = require('backbone');
var _ = require('underscore');
var AnalysisDefinitionNodeModel = require('builder/data/analysis-definition-node-model');
var DefaultLayerAnalysisView = require('builder/editor/layers/analysis-views/default-layer-analysis-view');
var $ = require('jquery');

describe('editor/layers/analysis-views/default-layers-analysis-view', function () {
  var $el;

  beforeEach(function () {
    $el = $('<div class="js-layer"><div class="js-Editor-ListLayer-titleText"></div></div>');

    this.model = new AnalysisDefinitionNodeModel({
      id: 'a3',
      type: 'trade-area',
      kind: 'walk',
      time: 300,
      source: 'a2'
    }, {
      configModel: {},
      sqlAPI: {}
    });

    this.analysisNode = new Backbone.Model();
    this.layerDefinitionModel = new Backbone.Model({id: 'l-1'});

    this.view = new DefaultLayerAnalysisView({
      model: this.model,
      analysisNode: this.analysisNode,
      layerDefinitionModel: this.layerDefinitionModel
    });
  });

  afterEach(function () {
    $el.remove();
  });

  describe('.render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should render correctly', function () {
      expect(_.size(this.view._subviews)).toBe(2); // [AnalysisTooltip, TipsyTooltipView]
      expect(this.view.$el.text()).toContain('analyses.area-of-influence');
      expect(this.view.el.className).toContain('js-analysis-node');
      expect(this.view.$el.attr('data-analysis-node-id')).toContain('a3');
    });

    describe('when analysis node is loading', function () {
      it('should render the loading state', function () {
        expect(this.view.$el.html()).toContain('Loader');
        expect(this.view.$el.text()).not.toContain('a3');
      });
    });

    describe('when analysis node is ready', function () {
      it('should render the node id', function () {
        this.analysisNode.set('status', 'ready');

        expect(this.view.$el.text()).toContain('a3');
        expect(this.view.$el.html()).not.toContain('Loader');
      });
    });

    describe('when analysis node status is failed', function () {
      it('should render the error elements', function () {
        this.analysisNode.set('status', 'failed');

        expect(this.view.$el.hasClass('has-error')).toBe(true);
        expect(this.view.$('.Editor-ListAnalysis-itemError').length).toBe(1);
      });
    });
  });

  describe('._initBinds', function () {
    it('should call _toggleHover on _stateModel change highlighted', function () {
      spyOn(this.view, '_toggleHover');
      this.view._initBinds();
      this.view._stateModel.trigger('change:highlighted');

      expect(this.view._toggleHover).toHaveBeenCalled();
    });
  });

  describe('._onMouseEnter', function () {
    it('should set _stateModel highlighted to true', function () {
      expect(this.view._stateModel.get('highlighted')).toBe(false);

      this.view._onMouseEnter();

      expect(this.view._stateModel.get('highlighted')).toBe(true);
    });
  });

  describe('._onMouseLeave', function () {
    it('should set _stateModel highlighted to false', function () {
      this.view._stateModel.set('highlighted', true, { silent: true });
      expect(this.view._stateModel.get('highlighted')).toBe(true);

      this.view._onMouseLeave();

      expect(this.view._stateModel.get('highlighted')).toBe(false);
    });
  });

  describe('._toggleHover', function () {
    it('should toggle hover', function () {
      $el.append(this.view.render().el);

      this.view._stateModel.set('highlighted', true, { silent: true });
      this.view._toggleHover();

      expect($el.hasClass('is-hover')).toBe(true);
      expect($el.find('.js-Editor-ListLayer-titleText').hasClass('is-hover')).toBe(true);

      this.view._stateModel.set('highlighted', false, { silent: true });
      this.view._toggleHover();

      expect($el.hasClass('is-hover')).toBe(false);
      expect($el.find('.js-Editor-ListLayer-titleText').hasClass('is-hover')).toBe(false);
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
