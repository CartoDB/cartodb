var cdb = require('cartodb.js');
var LayerDefinitionModel = require('../../../../../javascripts/cartodb3/data/layer-definition-model');
var LayerView = require('../../../../../javascripts/cartodb3/editor/layers/layer-view');

describe('editor/layers/layer-view', function () {
  beforeEach(function () {
    this.model = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      name: 'thename',
      source: 'c0'
    }, {
      configModel: {}
    });
    this.newAnalysisViewsSpy = jasmine.createSpy('newAnalysisViews').and.callFake(function (el) {
      var view = new cdb.core.View({
        el: el
      });
      view.render = function () {
        this.$el.html('ANALYSES');
        return this;
      };
      return view;
    });
    this.view = new LayerView({
      model: this.model,
      newAnalysisViews: this.newAnalysisViewsSpy
    });

    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title of layer', function () {
    expect(this.view.$el.text()).toContain('thename');
  });

  it('should render analysis views', function () {
    expect(this.view.$el.text()).toContain('ANALYSES');

    // Assert args being what's expected too
    expect(this.newAnalysisViewsSpy).toHaveBeenCalled();
    expect(this.newAnalysisViewsSpy.calls.argsFor(0)[0]).toEqual(this.view.$('.js-analysis'));
    expect(this.newAnalysisViewsSpy.calls.argsFor(0)[1]).toEqual(this.model);
  });
});
