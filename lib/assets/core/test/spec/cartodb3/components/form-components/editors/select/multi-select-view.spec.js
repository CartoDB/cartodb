var Backbone = require('backbone');
require('../../../../../../../javascripts/cartodb3/components/form-components/editors/select/multi-select-view.js');

describe('components/form-components/editors/select/multi-select-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'pepe'
    });

    this.view = new Backbone.Form.editors.MultiSelect({
      key: 'names',
      schema: {
        options: ['pepe', 'paco', 'juan', 'rm_rick', 'rm_morty', 'rm_summer', 'rm_jerry', 'rm_beth', 'rm_mr meeseeks']
      },
      model: this.model
    });
    this.view.render();
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('components.backbone-forms.select.selected');
    });
  });

  it('should trigger change event on select item', function (done) {
    var onChange = jasmine.createSpy('onChange');
    this.view.on('change', onChange);
    this.view.collection.at(1).set({selected: true});
    setTimeout(function () {
      expect(onChange).toHaveBeenCalled();
      done();
    }, 100);
  });

  describe('all/none buttons', function () {
    it('should trigger only one change event (debounce)', function (done) {
      var onChange = jasmine.createSpy('onChange');
      this.view.on('change', onChange);
      this.view._selectAll();
      setTimeout(function () {
        expect(onChange.calls.count()).toBe(1);
        done();
      }, 100);
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

    it('selects all with query', function () {
      this.view._selectAll();
      expect(this.view.collection.filter(function (m) {
        return m.get('selected');
      }).length).toBe(9);

      this.view._deselectAll();
      expect(this.view.collection.filter(function (m) {
        return m.get('selected');
      }).length).toBe(0);

      this.view.collection.at(0).set({ selected: true });
      this.view.collection.at(1).set({ selected: true });
      this.view.collection.at(2).set({ selected: true });

      this.view._listView.model.set({ query: 'rm_' });

      this.view._selectAll();

      expect(this.view.collection.at(0).get('selected')).toBe(false);
      expect(this.view.collection.at(1).get('selected')).toBe(false);
      expect(this.view.collection.at(2).get('selected')).toBe(false);
      expect(this.view.collection.filter(function (m) {
        return m.get('selected');
      }).length).toBe(6);
    });

    it('deselects all with query', function () {
      this.view._selectAll();

      this.view._listView.model.set({ query: 'rm_' });

      this.view._deselectSearch();

      expect(this.view.collection.at(0).get('selected')).toBe(true);
      expect(this.view.collection.at(1).get('selected')).toBe(true);
      expect(this.view.collection.at(2).get('selected')).toBe(true);
      expect(this.view.collection.filter(function (m) {
        return !m.get('selected');
      }).length).toBe(6);
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
