var Backbone = require('backbone');
var EditFeatureHeaderView = require('builder/editor/layers/edit-feature-content-views/edit-feature-header-view');
var FactoryModals = require('../../../factories/modals');

describe('editor/layers/edit-feature-content-views/edit-feature-header-view', function () {
  var letter = 'CustomLetter';
  var layerName = 'LayerName';
  var tableName = 'table_name';

  beforeEach(function () {
    this.model = {
      getFeatureType: function () { return 'line'; }
    };

    var layerDefinitionModel = new Backbone.Model({
      letter: letter
    });
    layerDefinitionModel.getColor = function () {
      return '#fabada';
    };
    layerDefinitionModel.getName = function () {
      return layerName;
    };
    layerDefinitionModel.tableName = function () {
      return tableName;
    };

    this.view = new EditFeatureHeaderView({
      url: 'http://',
      tableName: tableName,
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
      expect(this.view.$el.text()).toContain('back');
      expect(this.view.$el.text()).toContain('editor.edit-feature.edit');
      expect(this.view.$el.html()).toContain(layerName);
      expect(this.view.$el.html()).toContain(letter);
      expect(this.view.$el.html()).toContain('<a href="http://" target="_blank" title="' + tableName + '" class="Editor-headerLayerName">' + tableName + '</a>');
      expect(this.view.$el.html()).toContain('js-context-menu');
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
