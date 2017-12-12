var Backbone = require('backbone');
var EditFeatureHeaderView = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-header-view');
var FactoryModals = require('../../../factories/modals');

describe('editor/layers/edit-feature-content-views/edit-feature-header-view', function () {
  beforeEach(function () {
    this.model = {
      getFeatureType: function () { return 'line'; }
    };

    var layerDefinitionModel = new Backbone.Model({
      letter: 'MyLetter'
    });
    layerDefinitionModel.getName = function () {
      return 'Layer Name';
    };
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return { id: 'a0' };
    };

    this.view = new EditFeatureHeaderView({
      url: 'http://',
      tableName: 'foo',
      model: this.model,
      modals: FactoryModals.createModalService(),
      layerDefinitionModel: layerDefinitionModel,
      isNew: false,
      backAction: function () {}
    });

    this.view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(this.view.$el.text()).toContain('editor.edit-feature.breadcrumb.layer-list');
      expect(this.view.$el.text()).toContain('editor.edit-feature.edit');
      expect(this.view.$el.html()).toContain('a0');
      expect(this.view.$el.html()).toContain('Layer Name');
      expect(this.view.$el.html()).toContain('MyLetter');
      expect(this.view.$el.html()).toContain('<a href="http://" target="_blank" title="foo" class="Editor-headerLayerName">foo</a>');
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
