var cdb = require('cartodb.js');
var LayerSelectorView = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/layer-selector-view');

describe('components/modals/add-widgets/layer-selector-view', function () {
  beforeEach(function () {
    this.columnModel1 = new cdb.core.Model({
      name: 'col',
      type: 'string'
    });
    this.analysisDefinitionModel1 = new cdb.core.Model({ id: 'a1' });
    this.analysisDefinitionModel2 = new cdb.core.Model({ id: 'a2' });
    this.layerDefinitionModel1 = new cdb.core.Model({});
    this.layerDefinitionModel1.getName = function () { return 'layer1'; };
    this.columnModel2 = new cdb.core.Model({
      name: 'col',
      type: 'string'
    });
    this.layerDefinitionModel2 = new cdb.core.Model({});
    this.layerDefinitionModel2.getName = function () { return 'layer2'; };

    this.model = new cdb.core.Model({
      layer_index: 0,
      tuples: [{
        columnModel: this.columnModel1,
        layerDefinitionModel: this.layerDefinitionModel1,
        analysisDefinitionModel: this.analysisDefinitionModel1
      }, {
        columnModel: this.columnModel2,
        layerDefinitionModel: this.layerDefinitionModel2,
        analysisDefinitionModel: this.analysisDefinitionModel2
      }]
    });

    this.view = new LayerSelectorView({
      model: this.model
    });
    this.view = this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render fine', function () {
    expect(this.view).toBeDefined();
    expect(this.view.$el.html()).toContain('a1');
    expect(this.view.$el.html()).toContain('a2');
  });

  it('should change the selected item', function () {
    expect(this.model.get('layer_index')).toEqual(0);
  });

  describe('when a new option is selected', function () {
    beforeEach(function () {
      this.view.$el.val(1);
      this.view.$el.trigger('change');
    });

    it('should change the selected item', function () {
      expect(this.model.get('layer_index')).toEqual(1);
    });
  });
});
