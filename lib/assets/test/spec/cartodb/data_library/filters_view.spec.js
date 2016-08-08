var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var DatasetsCollection = require('../../../../javascripts/cartodb/data_library/datasets_collection');
var FiltersView = require('../../../../javascripts/cartodb/data_library/filters/view');
var DropdownView = require('../../../../javascripts/cartodb/data_library/filters/dropdown/view');

describe('data_library/filters_view', function() {
  var view;

  beforeEach(function() {
    this.model = new cdb.core.Model({
      vis_count: 0,
      show_countries: false
    });
    spyOn(this.model, 'bind').and.callThrough();

    this.collection = new DatasetsCollection();

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

    this.view = new FiltersView({
      collection: this.collection,
      model: this.model
    });
  });

  describe('render', function() {
    it('should render properly', function() {
      this.view.render();
      expect(this.view.$('.Filters-typeItem').length).toBe(3);
    });

    it('should have no leaks', function() {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('collection changes', function() {
    it('should change dropdown label when collection changed', function() {
      var spy = spyOn(this.collection.options, 'change');

      this.collection.options.set({
        tags: 'Administrative regions',
      });

      expect(spy).toHaveBeenCalled();
    });

    xit('should match dropdown label when collection changed', function() {
      this.collection.options.set({
        tags: 'Administrative regions',
      });

      this.view.render();

      expect(this.view.$('.js-categoriesDropdown-label').text()).toBe('Administrative regions');
    });

  });

  describe('dropdown', function() {
    beforeEach(function() {
      view = this.view;

      this.view.render();

      spyOn(DropdownView.prototype, 'initialize').and.callThrough();
      spyOn(DropdownView.prototype, 'render').and.callThrough();
      spyOn(DropdownView.prototype, 'open').and.callThrough();
      spyOn(DropdownView.prototype, 'on').and.callThrough();
      spyOn(DropdownView.prototype, 'clean').and.callThrough();

      this.clickSettings = function() {
        view.$('.js-categoriesDropdown').click();
      };
    });

    it('should create dropdown view', function() {
      this.clickSettings();
      expect(DropdownView.prototype.initialize).toHaveBeenCalled();
    });

    it('should have rendered and opened the dropdown view', function() {
      this.clickSettings();
      expect(DropdownView.prototype.render).toHaveBeenCalled();
      expect(DropdownView.prototype.open).toHaveBeenCalled();
    });

    it('should add the dropdown view to the child views', function() {
      var spy = spyOn(view, 'addView');
      this.clickSettings();
      expect(spy).toHaveBeenCalled();
    });

    it('should clean up dropdown view after the dropdown is hidden', function(done) {
      this.clickSettings();

      cdb.god.trigger('closeDialogs');

      setTimeout(function() {
        expect(DropdownView.prototype.clean).toHaveBeenCalled();
        done();
      }, 400);
    });

    it('should close any other open dialogs', function() {
      spyOn(cdb.god, 'trigger');
      this.clickSettings();
      expect(cdb.god.trigger).toHaveBeenCalledWith('closeDialogs');
    });

  });

  afterEach(function() {
    this.view.clean();
  });

});
