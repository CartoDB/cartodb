var _ = require('underscore');
var Backbone = require('backbone');
var InputCategoriesRampsListItemView = require('builder/components/form-components/editors/fill/input-color/input-qualitative-ramps/color-ramps-list/list-item-view/color-ramps-list-item-view');
var InputCategoriesRampsListItemTemplate = require('builder/components/form-components/editors/fill/input-color/input-qualitative-ramps/color-ramps-list/list-item-view/color-ramps-list-item.tpl');

describe('components/form-components/editors/fill/input-color/input-qualitative-ramps/color-ramps-list/list-item-view/color-ramps-list-item-view', function () {
  var view, model;
  var colorRamp = ['#855C75', '#D9AF6B', '#AF6458', '#736F4C', '#526A83', '#625377', '#68855C', '#9C9C5E', '#A06177', '#8C785D', '#7C7C7C'];

  var createViewFn = function (options) {
    if (!options) options = {};

    model = new Backbone.Model({
      disabled: false,
      selected: _.isUndefined(options.selected) ? true : options.selected
    });

    model.getName = function () {
      return colorRamp;
    };

    model.getValue = function () {
      return colorRamp;
    };

    var view = new InputCategoriesRampsListItemView({
      model: model,
      typeLabel: 'column',
      template: InputCategoriesRampsListItemTemplate
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  it('should have no leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  it('should render properly', function () {
    view.render();
    expect(view.$el.find('.js-listItemLink').hasClass('is-selected')).toBe(true);
    expect(view.$el.find('.js-listItemLink').hasClass('is-disabled')).toBe(false);
    expect(view.$el.find('.ColorBarContainer .ColorBar').length).toBe(colorRamp.length);
  });

  it('should add "is-highlighted" when mouse is over the view', function () {
    view._onMouseEnter();
    expect(view.$el.hasClass('is-highlighted')).toBe(true);
  });

  it('should add "is-highlighted" when mouse leaves the view', function () {
    view._onMouseEnter();
    expect(view.$el.hasClass('is-highlighted')).toBe(true);

    view._onMouseLeave();
    expect(view.$el.hasClass('is-highlighted')).toBe(false);
  });

  it('should trigger "customize" event if the view is clicked and is selected', function () {
    spyOn(view, 'trigger');
    view._onClick();

    expect(view.trigger).toHaveBeenCalledWith('customEvent', 'customize', model.getValue(), view);
  });

  it('should select the element if clicked and it wasn\'t selected', function () {
    var view = createViewFn({
      selected: false
    });

    view._onClick();

    expect(model.get('selected')).toBe(true);
  });
});
