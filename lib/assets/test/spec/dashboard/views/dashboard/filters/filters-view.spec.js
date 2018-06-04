const $ = require('jquery');
const DeleteItemsDialog = require('dashboard/views/dashboard/dialogs/delete-items/delete-items-view');
const ChangeLockDialog = require('dashboard/views/dashboard/dialogs/change-lock/change-lock-view');
const FiltersView = require('dashboard/views/dashboard/filters/filters-view');
const Router = require('dashboard/common/router-dashboard');
const LocalStorage = require('dashboard/helpers/local-storage');
const ConfigModelFixture = require('fixtures/dashboard/config-model.fixture');
const UserModel = require('dashboard/data/user-model');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');

describe('dashboard/filters_view', function () {
  beforeEach(function () {
    ConfigModelFixture.set('data_library_enabled', true);
    this.user = new UserModel({
      limits: {
        max_layers: 5
      },
      base_url: 'http://paco.carto.com',
      username: 'paco',
      actions: {
        private_tables: true
      }
    });
    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });

    this.collection = new VisualizationsCollection(null, {
      configModel: ConfigModelFixture
    });
    spyOn(this.collection, 'bind').and.callThrough();

    this.localStorage = new LocalStorage('test');

    this.modals = new ModalsServiceModel();
    spyOn(this.modals, 'create').and.callThrough();

    spyOn(FiltersView.prototype, 'listenTo').and.callThrough();

    this.view = new FiltersView({
      userModel: this.user,
      routerModel: this.router,
      collection: this.collection,
      localStorage: this.localStorage,
      configModel: ConfigModelFixture,
      modals: this.modals
    });

    // Initial render, subsequent should work just fine so if something breaks make sure to pinpoint the culprit
    this.view.render();
  });

  describe('.render', function () {
    describe('when regular user', function () {
      it("shouldn't show shared datasets link because user doesn't belong to an org", function () {
        this.view.render();
        expect(this.view.$('.Filters-typeItem').length).toBe(5);
        expect(this.innerHTML()).not.toContain('datasets/shared');
        expect(this.view.$('.Filters-orderItem').length).toBe(4);
      });
    });

    describe('organization', function () {
      it('should show shared datasets link if user belongs to an org', function () {
        spyOn(this.user, 'isInsideOrg').and.returnValue(true);
        this.view.render();
        expect(this.view.$('.Filters-typeItem').length).toBe(6);
        expect(this.innerHTML()).toContain('shared');
        expect(this.view.$('.Filters-orderItem').length).toBe(4);
      });
    });
  });

  it('should render only number of dashboards when deep-insights is enabled', function () {
    spyOn(this.router.model, 'isDeepInsights').and.returnValue(true);
    this.view.render();
    expect(this.view.$('.Filters-typeItem').size()).toBe(1);
    expect(this.view.$('.js-search-enabler').length).toBe(0);
  });

  it('should render on change events by router model', function () {
    this.router.model.set({
      content_type: 'datasets'
    });

    var args = this.view.listenTo.calls.argsFor(0);
    expect(args[0]).toEqual(this.router.model);
    expect(args[1]).toEqual('change');
    expect(args[2]).toEqual(this.view.render);
  });

  it('should deselect items when god triggers an event', function () {
    this.collection.reset({ selected: true }, { selected: true });

    // old behavior, should not deselect any items
    this.view._animate();
    expect(this.collection.where({ selected: true }).length).not.toBe(0);

    // new, should deselect
    this.view._unselectAll();
    expect(this.collection.where({ selected: true }).length).toBe(0);
  });

  it('should not show total figures when content_type router attribute has changed', function () {
    this.router.model.set('content_type', 'maps');
    expect(this.view.$('.Filters-typeLink').find('strong').length).toBe(0);
    this.collection.total_user_entries = 10;
    this.collection.total_likes = 1;
    this.collection.total_shared = 0;
    this.router.model.set('q', 'hello');
    expect(this.view.$('.Filters-typeLink').find('strong').length).toBe(2);
    expect(this.view.$('.js-link:eq(0) strong').text()).toBe('10');
    expect(this.view.$('.js-link:eq(1) strong').text()).toBe('1');
  });

  it('should change order with one is clicked', function () {
    this.view.render();
    this.view.$('.Filters-orderLink.js-likes').click();
    expect(this.localStorage.get('dashboard.order')).toBe('likes');
  });

  it('should show search when it is present in the route', function () {
    this.router.model.set('q', 'test');
    expect(this.view.$('.js-search-field').attr('style')).not.toContain('none');

    this.router.model.set('q', '');
    expect(this.view.$('.js-search-field').attr('style')).toContain('none');

    this.router.model.set('tag', 'paco');
    expect(this.view.$('.js-search-field').attr('style')).not.toContain('none');

    this.router.model.set('tag', '');
    expect(this.view.$('.js-search-field').attr('style')).toContain('none');

    this.router.model.set({ tag: 'tagg', search: 'paco' });
    expect(this.view.$('.js-search-field').attr('style')).not.toContain('none');
  });

  it('should hide search when click outside and it is not set', function () {
    this.view.render();
    this.view.$('.Filters-searchLink').click();
    expect(this.view.$('.js-search-field').attr('style')).not.toContain('none');

    this.view._animate();
    expect(this.view.$('.js-search-field').attr('style')).toContain('none');
  });

  describe('an item is selected', function () {
    beforeEach(function () {
      this.collection.reset({ selected: false });
      spyOn(this.view, '_animate').and.callThrough();
      this.collection.at(0).set('selected', true);
    });

    it('should do a animated render', function () {
      expect(this.view._animate).toHaveBeenCalled();
    });

    it('should mark the item as selected', function () {
      expect(this.view.$('.Filters-inner').hasClass('show-second-row')).toBeTruthy();
    });

    it('should show delete items', function () {
      expect(this.innerHTML()).toContain('Delete');
    });

    it('should show "your" word when a search is applied', function () {
      this.router.model.set({
        content_type: 'datasets',
        q: 'paco'
      });

      this.collection.reset([{ selected: true }]);
      expect(this.innerHTML()).toContain('Delete your dataset');
      this.collection.reset([{ selected: true }, { selected: true }]);
      expect(this.innerHTML()).toContain('Delete your datasets');
      expect(this.innerHTML()).toContain('Deselect all yours');
    });

    describe('create dataset', function () {
      beforeEach(function () {
        spyOn(this.user, 'canCreateDatasets').and.returnValue(true);
      });

      it('should be displayed when only one library dataset is selected', function () {
        this.router.model.set({
          content_type: 'datasets',
          library: false
        });
        this.collection.reset([{ selected: true }]);
        expect(this.view.$('.js-import_remote').length).toBe(0);
        this.collection.reset([{ type: 'remote', selected: true }]);
        expect(this.view.$('.js-import_remote').length).toBe(1);
        this.collection.reset([]);
        expect(this.view.$('.js-import_remote').length).toBe(0);
        this.collection.reset([{ selected: true, type: 'other' }]);
        expect(this.view.$('.js-import_remote').length).toBe(0);
        this.router.model.set({ content_type: 'maps' });
        this.collection.reset([{ selected: true, type: 'remote' }]);
        expect(this.view.$('.js-import_remote').length).toBe(0);
      });

      it('should trigger importByUploadData event when it is clicked', function () {
        this.router.model.set({
          content_type: 'datasets',
          library: true
        });
        this.collection.reset([{
          selected: true,
          type: 'remote',
          name: 'hello',
          table: {
            size: 1000
          }
        }]);
        var called = false;
        this.view.bind('importByUploadData', function () {
          called = true;
        });

        this.view.$('.js-import_remote').click();
        expect(called).toBeTruthy();
      });
    });

    describe('create map option', function () {
      it('should be displayed when selected items are datasets', function () {
        this.collection.reset([{ selected: true }]);
        this.router.model.set('content_type', 'datasets');
        expect(this.view.$('.js-create_map').length).toBe(1);
      });

      it('should not be displayed when selected items are not datasets', function () {
        this.router.model.set('content_type', 'maps');
        this.collection.reset([{ selected: true }]);
        expect(this.view.$('.js-create_map').length).toBe(0);
      });

      it('should not be displayed when user is in liked section', function () {
        this.router.model.set({
          content_type: 'datasets',
          liked: true
        });
        this.collection.reset([{ selected: true }]);
        expect(this.view.$('.js-create_map').length).toBe(0);
      });

      it('should be displayed when user is in data library section', function () {
        this.router.model.set({
          content_type: 'datasets',
          library: true,
          liked: false
        });
        this.collection.reset([{ selected: true }]);
        expect(this.view.$('.js-create_map').length).toBe(1);
      });

      it('should not be displayed when number of selected items are bigger than available layers per map', function () {
        this.user.set('limits', { max_layers: 1 });
        this.router.model.set('content_type', 'datasets');
        this.collection.reset([{ selected: true }, { selected: true }]);
        expect(this.view.$('.js-create_map').length).toBe(0);
        expect(this.innerHTML()).toContain('Max map layers selected');
      });

      it('should open create dialog once it is clicked', function () {
        spyOn(this.view, '_openCreateDialog');
        this.router.model.set('content_type', 'datasets');
        this.collection.reset([{ selected: true }]);
        this.view.$('.js-create_map').click();
        expect(this.view._openCreateDialog).toHaveBeenCalled();
      });
    });

    describe('delete_items option', function () {
      beforeEach(function () {
        this.router.model.set({
          content_type: 'datasets'
        });

        // For now only don't support batch processing, so only select one
        this.selectedItems = [
          { selected: false },
          { selected: false },
          { selected: true }
        ];
        this.collection.reset(this.selectedItems);
        spyOn(DeleteItemsDialog.prototype, 'initialize').and.callThrough();
      });

      afterEach(function (done) {
        this.view.clean();

        // Wait for the modal to close
        setTimeout(function () { done(); }, 250);
      });

      it('should be displayed when items belong to the user', function () {
        expect(this.innerHTML()).toContain('Delete  dataset');
      });

      it('should not be displayed when items don\'t belong to the user', function () {
        spyOn(this.collection.at(0).permission, 'isOwner').and.returnValue(false);
        this.view.render();
        expect(this.innerHTML()).not.toContain('Delete datasets');
      });

      it('should not be displayed when any item is remote type', function () {
        this.collection.at(0).set('type', 'remote');
        this.view.render();
        expect(this.innerHTML()).not.toContain('Delete datasets');
      });

      it('should open a delete-items dialog', function () {
        this.view.$('.js-delete').click();
        this.createdWith = DeleteItemsDialog.prototype.initialize.calls.argsFor(0)[0];
        expect(this.modals.create).toHaveBeenCalled();
      });

      it('should created dialog with a view model', function () {
        this.view.$('.js-delete').click();
        this.createdWith = DeleteItemsDialog.prototype.initialize.calls.argsFor(0)[0];
        expect(this.createdWith).toEqual(jasmine.objectContaining({ viewModel: jasmine.any(Object) }));
      });

      it('should created dialog with user', function () {
        this.view.$('.js-delete').click();
        this.createdWith = DeleteItemsDialog.prototype.initialize.calls.argsFor(0)[0];
        expect(this.createdWith).toEqual(jasmine.objectContaining({ userModel: this.user }));
      });
    });

    describe('and click lock items', function () {
      beforeEach(function () {
        // For now only don't support batch processing, so only select one
        this.selectedItems = [
          { selected: false },
          { selected: false },
          { selected: true }
        ];
        this.collection.reset(this.selectedItems);
        spyOn(ChangeLockDialog.prototype, 'initialize').and.callThrough();
        this.view.$('.js-lock').click();
        this.createdWith = ChangeLockDialog.prototype.initialize.calls.argsFor(0)[0];
      });

      afterEach(function (done) {
        this.view.clean();

        // Wait for the modal to close
        setTimeout(function () { done(); }, 250);
      });

      it('should open a lock items dialog', function () {
        expect(ChangeLockDialog.prototype.initialize).toHaveBeenCalled();
      });

      it('should created dialog with a view model', function () {
        expect(this.createdWith).toEqual(jasmine.objectContaining({ model: jasmine.any(Object) }));
      });
    });
  });

  describe('and click .js-privacy', function () {
    beforeEach(function () {
      // For now only don't support batch processing, so only select one
      this.selectedItems = [
        { selected: false },
        { selected: true, privacy: 'PRIVATE' }
      ];

      this.collection.reset(this.selectedItems);
      this.view.$('.js-privacy').click();
    });

    afterEach(function (done) {
      this.view.clean();

      // Wait for the modal to close
      setTimeout(function () { done(); }, 250);
    });

    it('should call global event bus to open privacy dialog', function () {
      expect(this.modals.create).toHaveBeenCalled();
    });

    it('should created dialog with selected items', function () {
      const dialog = $('.Dialog .OptionCards .is-selected');
      expect(dialog.text()).toContain('Private');
    });
  });

  describe('when submit search', function () {
    beforeEach(function () {
      spyOn(this.router, 'navigate');
      this.view.$('.js-search-input').val('fooo');
      this.view.$('.js-search-form').submit();
    });

    it('should call currentUrl with new search terms', function () {
      expect(this.router.navigate).toHaveBeenCalled();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).toContain('/search/fooo');
    });

    it('should request the first page', function () {
      this.router.model.set('page', 2);
      spyOn(this.view, '_navigateToUrl').and.callThrough();
      this.view.$('.js-search-input').val('fooo');
      this.view.$('.js-search-form').submit();
      var args = this.view._navigateToUrl.calls.argsFor(0);
      expect(args[0].page).toBe(1);
    });

    it('should not search applying any filter', function () {
      this.router.model.set('shared', 'yes');
      this.view.$('.js-search-form').submit();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).not.toContain('/shared');
      this.router.model.set({ shared: 'no', liked: true });
      this.view.$('.js-search-form').submit();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).not.toContain('/liked');
      this.router.model.set({ shared: 'no', liked: false, library: true });
      this.view.$('.js-search-form').submit();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).not.toContain('/library');
      this.router.model.set({ locked: true });
      this.view.$('.js-search-form').submit();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).not.toContain('/locked');
    });
  });

  describe('when click clear search', function () {
    beforeEach(function () {
      spyOn(this.router, 'navigate');

      // Simulate already search
      this.router.model.set('q', 'foo');
      this.view.render();

      this.view.$('.js-clean-search').click();
    });

    it('should reset URL', function () {
      expect(this.router.navigate).toHaveBeenCalled();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).not.toContain('/search');
    });

    it('should always go to default content-type, not to any filter route', function () {
      this.router.model.set({ shared: true });
      this.view.render();
      this.view.$('.js-clean-search').click();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).toContain('dashboard/datasets');
      this.router.model.set({ shared: 'no', liked: true });
      this.view.$('.js-search-form').click();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).toContain('dashboard/datasets');
      this.router.model.set({ shared: 'no', liked: false, library: true });
      this.view.$('.js-search-form').click();
      expect(this.router.navigate.calls.argsFor(0)[0].toString()).toContain('dashboard/datasets');
    });
  });

  describe('when click search', function () {
    beforeEach(function () {
      spyOn(this.router, 'navigate');

      this.click = function () {
        this.view.$('.js-search-link').click();
      };
    });

    it('should toggle search', function () {
      this.click();
      expect(this.router.navigate).not.toHaveBeenCalled();
      expect(this.view.$('.js-search-field').attr('style')).not.toContain('none');

      this.click();
      expect(this.router.navigate).not.toHaveBeenCalled();
      expect(this.view.$('.js-search-field').attr('style')).toContain('none');

      this.click(); // enable search again
      this.router.model.set({ q: 'test-search-clean' }, { silent: true });
      this.click();
      expect(this.router.navigate).toHaveBeenCalled();
      expect(this.router.navigate.calls.argsFor(0)[0]).not.toContain('search/');
      expect(this.view.$('.js-search-field').attr('style')).toContain('none');
    });
  });

  describe('dataset duplication', function () {
    beforeEach(function () {
      this.router.model.set('content_type', 'datasets');
      spyOn(this.user, 'canCreateDatasets').and.returnValue(true);
      this.collection.reset([{ selected: true }]);
    });

    it('should not be displayed when selected items are maps', function () {
      this.router.model.set({
        content_type: 'maps',
        liked: false
      });
      expect(this.view.$('.js-duplicate_dataset').length).toBe(0);
    });

    it('should be displayed when selected items are datasets', function () {
      this.router.model.set({
        liked: false
      });
      expect(this.view.$('.js-duplicate_dataset').length).toBe(1);
    });

    it('should not be displayed when selected items are not datasets', function () {
      this.router.model.set('content_type', 'maps');
      expect(this.view.$('.js-duplicate_dataset').length).toBe(0);
    });

    it('should not be displayed when user is in liked section', function () {
      this.router.model.set({
        liked: true
      });
      expect(this.view.$('.js-duplicate_dataset').length).toBe(0);
    });

    it('should not be displayed when user is in data library section', function () {
      this.router.model.set({
        library: true
      });
      expect(this.view.$('.js-duplicate_dataset').length).toBe(0);
    });

    it('should be displayed when user is in shared section', function () {
      this.router.model.set({
        library: false,
        liked: false,
        shared: 'yes'
      });
      expect(this.view.$('.js-duplicate_dataset').length).toBe(1);
    });

    it('should not be displayed when there are several items selected', function () {
      this.router.model.set({
        liked: false
      });
      this.collection.reset([{ selected: true }, { selected: true }]);
      expect(this.view.$('.js-duplicate_dataset').length).toBe(0);
    });

    it('should not be displayed when the item is a data-library search result ', function () {
      this.router.model.set({
        search: 'jar'
      });
      this.collection.reset([{ selected: true, type: 'remote' }, { selected: false }]);
      expect(this.view.$('.js-duplicate_dataset').length).toBe(0);
    });
  });

  describe('duplicate map', function () {
    beforeEach(function () {
      this.router.model.set('content_type', 'maps');
      this.collection.reset([{ selected: true }]);
    });

    it('should offer duplicate map', function () {
      expect(this.view.$('.js-duplicate_map').length).toBe(1);
    });

    it("shouldn't offer duplicate map when content type is datasets", function () {
      this.router.model.set('content_type', 'datasets');
      this.collection.reset([{ selected: true }]);
      expect(this.view.$('.js-duplicate_map').length).toBe(0);
    });

    it("shouldn't offer duplicate map when there are several maps selected", function () {
      this.collection.reset([{ selected: true }, { selected: true }]);
      expect(this.view.$('.js-duplicate_map').length).toBe(0);
    });

    it('should not offer duplicate map when it is a liked map', function () {
      this.router.model.set('liked', true);
      this.view.render();
      expect(this.view.$('.js-duplicate_map').length).toBe(0);
    });
  });

  it('shouldn\'t offer select all option when it is viewing liked items', function () {
    this.router.model.set({
      content_type: 'datasets',
      liked: true
    });
    this.selectedItems = [
      { selected: false },
      { selected: true }
    ];
    this.collection.reset(this.selectedItems);
    expect(this.view.$('.js-select_all').length).toBe(0);
    expect(this.view.$('.js-deselect_all').length).toBe(0);
  });

  it('should have no leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
