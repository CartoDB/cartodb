var _ = require('underscore');
var Backbone = require('backbone');
var InputCategoriesRampsListView = require('builder/components/form-components/editors/fill/input-color/input-qualitative-ramps/color-ramps-list/list-view/color-ramps-list-view');

describe('components/form-components/editors/fill/input-color/input-qualitative-ramps/color-ramps-list/list-view/color-ramps-list-view', function () {
  var view, model;
  var ramp = ['#5F4690', '#1D6996', '#38A6A5', '#0F8554', '#73AF48', '#EDAD08', '#E17C05', '#CC503E', '#94346E', '#6F4070', '#666666'];

  var createViewFn = function (options) {
    if (!options) options = {};

    model = new Backbone.Model({
      type: 'color',
      attribute: 'common_species',
      attribute_type: 'string',
      range: _.isUndefined(options.range) ? ramp : options.range,
      images: ['', '', '', '', '', '', '', '', '', '', ''],
      domain: ['Brisbane Box', 'Sycamore', 'New Zealand Xmas Tree', 'Swamp Myrtle', 'Hybrid Strawberry Tree', 'Laurel Fig', 'Victorian Box', 'Cherry Plum', 'Southern Magnolia', 'Brisbane Box'],
      selected: true
    });

    var view = new InputCategoriesRampsListView({
      model: model,
      maxValues: 10,
      requiredNumberOfColors: 10
    });

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    beforeEach(function () {
      view.render();
    });

    it('should render properly', function () {
      expect(view.$el.find('.js-rampsList').length).toBe(1);
      expect(view.$el.find('.js-list').children().length).not.toBeLessThan(1);
    });

    it('should render the custom ramp if any', function () {
      var customRamp = ['#5F4690', '#1D6996', '#38A6A5', '#0F8554', '#73AF48', '#EDAD08', '#E17C05', '#CC503E', '#94346E', '#6F4070', '#999999'];
      view = createViewFn({
        range: customRamp
      });

      view.render();

      expect(view.$el.find('.js-customList').hasClass('is-customized')).toBe(true);
      expect(view.$el.find('.js-customList .ColorBarContainer').children().length).toBe(customRamp.length);
    });
  });

  describe('._selectRamp', function () {
    it('should select a ramp', function () {
      view.render();
      view._selectRamp(new Backbone.Model({
        val: ramp
      }));

      var rampDOMElement = view.$('.js-listItem[data-val="' + ramp.join(',') + '"] .js-listItemLink');
      expect(rampDOMElement.hasClass('is-selected')).toBe(true);
    });
  });

  describe('._onSelectItem', function () {
    it('should set the selected ramp in the model and trigger an event', function () {
      spyOn(view, 'trigger');
      var item = new Backbone.Model({
        val: ramp
      });

      view._onSelectItem(item);

      expect(model.get('range')).toBe(ramp);
      expect(view.trigger).toHaveBeenCalledWith('ramp-selected', ramp, view);
    });
  });

  describe('._setupCollection', function () {
    it('should setup the collection with the provided qualitative ramps', function () {
      view = createViewFn();
      view._setupCollection();

      expect(view.collection.length).toBe(6);
    });

    it('should select mark the ramp as selected if is in the model', function () {
      view = createViewFn({
        range: ramp
      });
      view._setupCollection();

      var selectedRamp = view.collection.find(function (model) {
        return model.get('val').join() === ramp.join();
      });

      expect(selectedRamp.get('selected')).toBe(true);
    });

    it('should select the selected ramp as custom if is not inside the collection', function () {
      var customRamp = ['#000000'];
      view = createViewFn({
        range: customRamp
      });

      expect(view._customRamp.get('range')).toBe(customRamp);
      expect(view.collection.findWhere({ selected: true })).toBeUndefined();
    });
  });

  describe('._onClickCustomize', function () {
    beforeEach(function () {
      view = createViewFn({
        range: ramp
      });
      view._setupCollection();
    });

    it('should set the current selected ramp as custom', function () {
      var selectedRamp = view.collection.findWhere({ selected: true });
      view._onClickCustomize();
      expect(view._customRamp.get('range')).toBe(selectedRamp);
    });

    it('should trigger a customize event', function () {
      spyOn(view, 'trigger');
      view._onClickCustomize();
      expect(view.trigger).toHaveBeenCalled();
    });
  });

  describe('._onClickClear', function () {
    it('should clear customRamp range', function () {
      var customRamp = ['#000000'];
      view = createViewFn({
        range: customRamp
      });
      expect(view._customRamp.get('range')).toBe(customRamp);

      view._onClickClear();
      expect(view._customRamp.get('range')).toBe(null);
    });

    it('should select the first ramp in the collection', function () {
      view.collection.getSelectedItem().set('selected', false);

      view._onClickClear();
      expect(view.collection.at(0).get('selected')).toBe(true);
    });
  });

  describe('._onClickCustomRamp', function () {
    it('should change to customize view if custom ramp is applied', function () {
      var customRamp = ['#999999', '#FFF000'];
      view = createViewFn({
        range: customRamp
      });

      spyOn(view, 'trigger');
      view._onClickCustomRamp();
      expect(view.trigger).toHaveBeenCalledWith('customize', view.collection.findWhere({ selected: true }), view);
    });
  });
});
