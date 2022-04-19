var $ = require('jquery');
var Backbone = require('backbone');
var LayerSelectorView = require('builder/components/modals/add-widgets/layer-selector-view');

describe('components/modals/add-widgets/layer-selector-view', function () {
  var $el;

  beforeEach(function () {
    $el = $('<div class="js-WidgetList-item"></div>');

    this.columnModel1 = new Backbone.Model({
      name: 'col',
      type: 'string'
    });
    this.analysisDefinitionModel1 = new Backbone.Model({ id: 'a1' });
    this.analysisDefinitionModel2 = new Backbone.Model({ id: 'a2' });
    this.analysisDefinitionModel1.isSourceType = this.analysisDefinitionModel2.isSourceType = function () {
      return true;
    };
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
    this.layerDefinitionModel1.getColor = this.layerDefinitionModel2.getColor = function () {
      return '#fabada';
    };
    this.layerDefinitionModel1.getName = this.layerDefinitionModel2.getName = function () {
      return this.get('table_name');
    };
    this.layerDefinitionModel1.getTableName = this.layerDefinitionModel2.getTableName = function () {
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

  afterEach(function () {
    $el.remove();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render table name and node id in the selected item', function () {
    expect(this.view).toBeDefined();
    expect(this.view.$el.html()).toContain('bar');
    expect(this.view.$el.html()).toContain('a2');
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

  it('should stop event propagation when element is clicked', function () {
    var eventMock = {
      stopPropagation: jasmine.createSpy()
    };

    this.view._onClick(eventMock);

    expect(eventMock.stopPropagation).toHaveBeenCalled();
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

  describe('._onMouseOver', function () {
    it('should set highlighted to true', function () {
      expect(this.view._stateModel.get('highlighted')).toBe(false);

      this.view._onMouseOver();

      expect(this.view._stateModel.get('highlighted')).toBe(true);
    });
  });

  describe('._onMouseOut', function () {
    it('should set highlighted to false', function () {
      this.view._stateModel.set({ highlighted: true }, { silent: true });

      this.view._onMouseOut();

      expect(this.view._stateModel.get('highlighted')).toBe(false);
    });
  });

  describe('._toggleHover', function () {
    it('should toggle highlighted', function () {
      $el.append(this.view.el);

      this.view._stateModel.set('highlighted', true, { silent: true });
      this.view._toggleHover();

      expect($el.hasClass('is-hover')).toBe(true);

      this.view._stateModel.set('highlighted', false, { silent: true });
      this.view._toggleHover();

      expect($el.hasClass('is-hover')).toBe(false);
    });
  });
});
