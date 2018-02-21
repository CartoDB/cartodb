var Backbone = require('backbone');
var _ = require('underscore');
// Required for affected specs, because we use backbone-forms through a global namespace
require('builder/components/form-components/editors/select/multi-select-view.js');

function viewFactory (model) {
  return new Backbone.Form.editors.MultiSelect({
    key: 'names',
    schema: {
      options: ['pepe', 'paco', 'juan', 'rm_rick', 'rm_morty', 'rm_summer', 'rm_jerry', 'rm_beth', 'rm_mr meeseeks']
    },
    model: model
  });
}

describe('components/form-components/editors/select/multi-select-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'pepe'
    });

    this.view = viewFactory(this.model);
    this.view.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('components.backbone-forms.select.selected');
    });
  });

  it('should trigger change event on select item', function () {
    var onChange = jasmine.createSpy('onChange');
    spyOn(_, 'debounce').and.callFake(function () {
      return onChange;
    });

    var aView = viewFactory(this.model);
    aView.render();

    aView.on('change', onChange);
    aView.collection.at(1).set({selected: true});

    expect(onChange).toHaveBeenCalled();
    aView.remove();
  });

  describe('all/none buttons', function () {
    it('should use _.debounce to prevent multiple change events firing', function () {
      var mockbounce = spyOn(_, 'debounce').and.callThrough();
      var aView = viewFactory(this.model);
      aView._selectAll();

      expect(mockbounce).toHaveBeenCalled();
    });

    it('selects and deselects all', function () {
      this.view._selectAll();
      expect(this.view.collection.every(function (model) {
        return model.get('selected');
      })).toBe(true);

      this.view._deselectAll();
      expect(this.view.collection.every(function (model) {
        return !model.get('selected');
      })).toBe(true);
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
