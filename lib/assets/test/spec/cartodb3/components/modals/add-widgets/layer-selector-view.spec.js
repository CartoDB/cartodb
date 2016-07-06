var Backbone = require('backbone');
var LayerSelectorView = require('../../../../../../javascripts/cartodb3/components/modals/add-widgets/layer-selector-view');

describe('components/modals/add-widgets/layer-selector-view', function () {
  beforeEach(function () {
    this.columnModel1 = new Backbone.Model({
      name: 'col',
      type: 'string'
    });
    this.analysisDefinitionModel1 = new Backbone.Model({ id: 'a1' });
    this.analysisDefinitionModel2 = new Backbone.Model({ id: 'a2' });
    this.layerDefinitionModel1 = new Backbone.Model({
      table_name: 'foo'
    });
    this.columnModel2 = new Backbone.Model({
      name: 'col',
      type: 'string'
    });
    this.layerDefinitionModel2 = new Backbone.Model({
      table_name: 'bar'
    });
    this.layerDefinitionModel1.getName = this.layerDefinitionModel2.getName = function () {
      return this.get('table_name');
    };

    this.model = new Backbone.Model({
      layer_index: 0,
      tuples: [{
        columnModel: this.columnModel1,
        layerDefinitionModel: this.layerDefinitionModel1,
        analysisDefinitionNodeModel: this.analysisDefinitionModel1
      }, {
        columnModel: this.columnModel2,
        layerDefinitionModel: this.layerDefinitionModel2,
        analysisDefinitionNodeModel: this.analysisDefinitionModel2
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

  it('should render table name and node id in the selected item', function () {
    expect(this.view).toBeDefined();
    expect(this.view.$el.html()).toContain('foo');
    expect(this.view.$el.html()).toContain('a1');
  });

  it('should render table name and node id in the custom list items', function () {
    this.view._selectView._onButtonClick();
    var customList = this.view.$('.js-list').html();

    expect(customList).toContain('foo');
    expect(customList).toContain('a1');
    expect(customList).toContain('bar');
    expect(customList).toContain('a2');
  });

  it('should change the selected item', function () {
    expect(this.model.get('layer_index')).toEqual(0);
  });

  describe('when a new option is selected', function () {
    beforeEach(function () {
      this.view._selectView.setValue(1);
      this.view._selectView.trigger('change');
    });

    it('should change the selected item', function () {
      expect(this.model.get('layer_index')).toEqual(1);
    });
  });
});
