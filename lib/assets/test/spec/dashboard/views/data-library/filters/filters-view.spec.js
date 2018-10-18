const Backbone = require('backbone');
const DatasetsCollection = require('dashboard/data/datasets-collection');
const FiltersView = require('dashboard/views/data-library/filters/filters-view');
const DropdownView = require('dashboard/views/data-library/filters/dropdown/dropdown-view');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data-library/filters/filters-view', function () {
  let view;

  beforeEach(function () {
    this.model = new Backbone.Model({
      vis_count: 0,
      show_countries: false
    });
    spyOn(this.model, 'bind').and.callThrough();

    this.collection = new DatasetsCollection(null, { configModel });

    this.collection.options.set({
      q: '',
      order: 'updated_at',
      page: 1,
      tags: '',
      // bbox: '',
      source: [],
      type: 'table'
    });
    spyOn(this.collection.options, 'bind').and.callThrough();

    spyOn(FiltersView.prototype, 'render').and.callThrough();

    this.view = new FiltersView({
      collection: this.collection,
      model: this.model
    });
  });

  describe('render', function () {
    it('should render properly', function () {
      this.view.render();
      expect(this.view.$('.Filters-typeItem').length).toBe(3);
    });

    it('should have no leaks', function () {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('collection changes', function () {
    it('should call render when collection changed', function () {
      this.collection.options.set({
        tags: 'Administrative regions'
      });

      expect(this.view.render).toHaveBeenCalled();
    });

    it('should match dropdown label when collection changed', function () {
      this.collection.options.set({
        tags: 'Administrative regions'
      });

      this.view.render();

      expect(this.view.$('.js-categoriesDropdown').text()).toContain('Administrative regions');
    });
  });

  describe('dropdown', function () {
    beforeEach(function () {
      view = this.view;

      this.view.render();

      spyOn(DropdownView.prototype, 'initialize').and.callThrough();
      spyOn(DropdownView.prototype, 'render').and.callThrough();
      spyOn(DropdownView.prototype, 'open').and.callThrough();
      spyOn(DropdownView.prototype, 'on').and.callThrough();
      spyOn(DropdownView.prototype, 'clean').and.callThrough();

      this.clickSettings = function () {
        view.$('.js-categoriesDropdown').click();
      };
    });

    it('should create dropdown view', function () {
      this.clickSettings();
      expect(DropdownView.prototype.initialize).toHaveBeenCalled();
    });

    it('should have rendered and opened the dropdown view', function () {
      this.clickSettings();
      expect(DropdownView.prototype.render).toHaveBeenCalled();
      expect(DropdownView.prototype.open).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function () {
      const spy = spyOn(view, 'addView').and.callThrough();

      this.clickSettings();

      expect(spy).toHaveBeenCalled();
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
