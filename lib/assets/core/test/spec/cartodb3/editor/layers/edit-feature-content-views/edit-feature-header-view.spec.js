var Backbone = require('backbone');
var EditFeatureHeaderView = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-header-view');
var FactoryModals = require('../../../factories/modals');

describe('editor/layers/edit-feature-content-views/edit-feature-header-view', function () {
  var letter = 'CustomLetter';
  var layerName = 'LayerName';
  var layerId = 'a0';

  beforeEach(function () {
    this.model = {
      getFeatureType: function () { return 'line'; }
    };

    var layerDefinitionModel = new Backbone.Model({
      letter: letter
    });
    layerDefinitionModel.getName = function () {
      return layerName;
    };
    layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return { id: layerId };
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
      expect(this.view.$el.html()).toContain(layerId);
      expect(this.view.$el.html()).toContain(layerName);
      expect(this.view.$el.html()).toContain(letter);
      expect(this.view.$el.html()).toContain('<a href="http://" target="_blank" title="foo" class="Editor-headerLayerName">foo</a>');
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
