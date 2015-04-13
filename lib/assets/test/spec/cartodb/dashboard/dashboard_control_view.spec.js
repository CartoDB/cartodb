describe("Dashboard control view", function() {

  var tables, visualizations, router, user, view;

  beforeEach(function() {
    visualizations = new cdb.admin.Visualizations({ type: 'derived' });
    tables = new cdb.admin.Visualizations({ type: 'table' });
    router = new cdb.admin.dashboard.DashboardRouter();
    user = TestUtil.createUser('test');

    var $div = $('<div>').append(' \
      <article class="subheader"></article>\
      <article class="no_tables"></article>\
      <article class="no_vis"></article>\
      <article class="no_shared no_results">tables</article>\
      <article class="empty_search">tables</article>\
      <article class="error"></article>\
      <article class="visualizations"></article>\
      <article class="tables"></article>\
      <article class="more_data"></article>\
    ');
    view = new cdb.admin.dashboard.ControlView({
      el:             $div,
      visualizations: visualizations,
      tables:         tables,
      router:         router,
      user:           user,
      config:         { custom_com_hosted: false }
    });
  });

  afterEach(function() {});

  it("should control several dashboard views", function() {
    expect(view._VIEWS.length).toBe(9);
  });

  it("should show welcome view when tables collection is empty", function() {
    router.model.set('model', 'tables', { silent: true });
    tables.total_entries = 0;
    tables.reset();
    expect(view.$('.no_tables').hasClass('active')).toBeTruthy();
    expect(view.$('.subheader').hasClass('active')).toBeFalsy();
  });

  it("should show first tables page when user goes to a inexistant page", function() {
    // Go to first page of tables
    router.model.set({
      model: 'tables',
      page: 5
    }, { silent: true });

    spyOn(view, '_navigateToTables');

    tables.total_entries = 10;
    tables.reset([]);
    expect(view._navigateToTables).toHaveBeenCalled();

    // Go to first page of visualizations
    router.model.set({
      model: 'visualizations',
      page: 5
    }, { silent: true });

    spyOn(view, '_navigateToVis');

    visualizations.total_entries = 10;
    visualizations.reset([]);
    expect(view._navigateToVis).toHaveBeenCalled();
  });

  it("should show tables list when tables collection is not empty", function() {
    router.model.set('model', 'tables', { silent: true });
    tables.total_entries = 10;
    tables.reset([{ id:'test_id', name: 'name' }]);
    expect(view.$('.no_tables').hasClass('active')).toBeFalsy();
    expect(view.$('.no_vis').hasClass('active')).toBeFalsy();
    expect(view.$('.tables').hasClass('active')).toBeTruthy();
  });

  it("should setup limit when any collection is fetched", function() {
    router.model.set('model', 'tables', { silent: true });
    spyOn(view, '_setupLimits');
    tables.total_entries = 2;
    tables.reset([{ id:'test_id', name: 'name' }]);
    expect(view._setupLimits).toBeTruthy();

    router.model.set('model', 'visualizations', { silent: true });
    visualizations.total_entries = 1;
    visualizations.reset([{ id:'test_id', name: 'name' }]);
    expect(view._setupLimits).toBeTruthy();
  });

  it("should show main loader when router changes to tables or visualizations", function() {
    spyOn(view, 'showMainLoader');
    spyOn(view, 'hideMainLoader');
    spyOn(view, '_scrollToTop');
    router.model.set({ model: 'tables' });
    expect(view.$('.subheader').hasClass('active')).toBeTruthy();
    expect(view.showMainLoader).toHaveBeenCalled();
    expect(view._scrollToTop).toHaveBeenCalled();
    tables.reset([]);
    expect(view.hideMainLoader).toHaveBeenCalled();
  });

  it("shouldn't show main loader when router changes any parameter, but not model", function() {
    router.model.set({ model: 'tables' }, { silent: true });
    tables.total_entries = 1;
    tables.reset([{ id:'test_id', name: 'name' }]);
    spyOn(view, 'showMainLoader');
    router.model.set({ q: 'test' });
    expect(view.$('.subheader').hasClass('active')).toBeTruthy();
    expect(view.showMainLoader).not.toHaveBeenCalled();
  });

  it("should show bar-loader when router changes any parameter, but not model", function() {
    router.model.set({ model: 'tables' }, { silent: true });
    tables.total_entries = 1;
    tables.reset([{ id:'test_id', name: 'name' }]);
    spyOn(view, 'showBarLoader');
    router.model.set({ q: 'test' });
    expect(view.$('.subheader').hasClass('active')).toBeTruthy();
    expect(view.showBarLoader).toHaveBeenCalled();
  });

  it("should hide bar-loader when collection fetch finishes", function() {
    router.model.set({ model: 'tables' }, { silent: true });
    tables.total_entries = 1;
    spyOn(view, 'hideBarLoader');
    tables.reset([{ id:'test_id', name: 'name' }]);
    expect(view.hideBarLoader).toHaveBeenCalled();

    router.model.set({ q: 'test' });
    tables.reset([{ id:'test_id', name: 'name' }]);
    expect(view.hideBarLoader).toHaveBeenCalled();
  });

  it("should show the error block when any collection fetch fails", function() {
    router.model.set({ model: 'tables' }, { silent: true });
    spyOn(view, 'hideBarLoader');
    spyOn(view, 'hideMainLoader');
    
    tables.trigger('error');
    expect(view.$('.no_tables').hasClass('active')).toBeFalsy();
    expect(view.$('.error').hasClass('active')).toBeTruthy();
    expect(view.hideMainLoader).toHaveBeenCalled();
    expect(view.hideBarLoader).toHaveBeenCalled();

    tables.reset([]);
    expect(view.$('.no_tables').hasClass('active')).toBeTruthy();
    expect(view.$('.error').hasClass('active')).toBeFalsy();
    expect(view.hideBarLoader).toHaveBeenCalled();

    visualizations.trigger('error');
    expect(view.$('.no_tables').hasClass('active')).toBeFalsy();
    expect(view.$('.error').hasClass('active')).toBeTruthy();
    expect(view.hideMainLoader).toHaveBeenCalled();
    expect(view.hideBarLoader).toHaveBeenCalled();
  });

  it("shouldn't show the error block when any collection fetch is aborted", function() {
    router.model.set({ model: 'tables' }, { silent: true });
    spyOn(view, 'hideBarLoader');
    spyOn(view, 'hideMainLoader');
    
    tables.trigger('error', tables, { statusText: 'abort' } );
    expect(view.$('.error').hasClass('active')).toBeFalsy();
    expect(view.hideMainLoader).not.toHaveBeenCalled();
    expect(view.hideBarLoader).not.toHaveBeenCalled();

    visualizations.trigger('error', visualizations, { statusText: 'abort' });
    expect(view.$('.error').hasClass('active')).toBeFalsy();
    expect(view.hideMainLoader).not.toHaveBeenCalled();
    expect(view.hideBarLoader).not.toHaveBeenCalled();
  });

  it("should show tables or visualizations list when query search works", function() {
    router.model.set({ model: 'tables', q: 'table' });
    tables.total_entries = 1;
    tables.reset([{ id:'test_id', name: 'name' }]);
    expect(view.$('.tables').hasClass('active')).toBeTruthy();
    expect(view.$('.no_tables').hasClass('active')).toBeFalsy();
    expect(view.$('.visualizations').hasClass('active')).toBeFalsy();
    expect(view.$('.empty_search').hasClass('active')).toBeFalsy();
  });

  it("should show 'no results found' block list when query search is empty", function() {
    router.model.set({ model: 'tables', q: 'table' });
    tables.total_entries = 0;
    tables.reset();
    expect(view.$('.tables').hasClass('active')).toBeFalsy();
    expect(view.$('.visualizations').hasClass('active')).toBeFalsy();
    expect(view.$('.empty_search').hasClass('active')).toBeTruthy();
    expect(view.$('.empty_search').text()).toBe('tables');

    router.model.set({ model: 'visualizations', q: 'table' });
    visualizations.total_entries = 0;
    visualizations.reset();
    expect(view.$('.tables').hasClass('active')).toBeFalsy();
    expect(view.$('.visualizations').hasClass('active')).toBeFalsy();
    expect(view.$('.empty_search').hasClass('active')).toBeTruthy();
    expect(view.$('.empty_search').text()).toBe('visualizations');
  });

  it("should show tables or visualizations list when tag search works", function() {
    router.model.set({ model: 'tables', tag: 'test' });
    tables.total_entries = 1;
    tables.reset([{ id:'test_id', name: 'name' }]);
    expect(view.$('.tables').hasClass('active')).toBeTruthy();
    expect(view.$('.no_tables').hasClass('active')).toBeFalsy();
    expect(view.$('.visualizations').hasClass('active')).toBeFalsy();
    expect(view.$('.empty_search').hasClass('active')).toBeFalsy();
  });

  it("should show 'no results found' block list when tag search is empty", function() {
    router.model.set({ model: 'tables', tag: 'test' });
    tables.total_entries = 0;
    tables.reset();
    expect(view.$('.tables').hasClass('active')).toBeFalsy();
    expect(view.$('.visualizations').hasClass('active')).toBeFalsy();
    expect(view.$('.empty_search').hasClass('active')).toBeTruthy();
    expect(view.$('.empty_search').text()).toBe('tables');

    router.model.set({ model: 'visualizations', tag: 'test' });
    visualizations.total_entries = 0;
    visualizations.reset();
    expect(view.$('.tables').hasClass('active')).toBeFalsy();
    expect(view.$('.visualizations').hasClass('active')).toBeFalsy();
    expect(view.$('.empty_search').hasClass('active')).toBeTruthy();
    expect(view.$('.empty_search').text()).toBe('visualizations');
  });

  it("should show tables/visualizations block if user doesn't belong to a organization and wants to display 'mine' block", function() {
    spyOn(view, '_navigateToTables');
    router.model.set({ model: 'visualizations', exclude_shared: true });
    visualizations.total_entries = 1;
    visualizations.reset([{ id:'test_id', name: 'name' }]);
    expect(view._navigateToTables).toHaveBeenCalled();
  });

  it("should show 'mine block' tables or visualizations where there are any available and user belongs to a org", function() {
    var org = new cdb.admin.Organization({ id: 3, users: [1,2,3] });
    user.organization = org;
    spyOn(view, '_navigateToTables');
    router.model.set({ model: 'visualizations', exclude_shared: true });
    visualizations.total_entries = 1;
    visualizations.reset([{ id:'test_id', name: 'name' }]);
    expect(view.$('.visualizations').hasClass('active')).toBeTruthy();
    expect(view._navigateToTables).not.toHaveBeenCalled();
  });

  it("should show empty tables or visualizations when user doesn't own any table or vis and user belongs to a org", function() {
    var org = new cdb.admin.Organization({ id: 3, users: [1,2,3] });
    user.organization = org;
    router.model.set({ model: 'visualizations', exclude_shared: true });
    visualizations.total_entries = 0;
    visualizations.reset();

    expect(view.$('.visualizations').hasClass('active')).toBeFalsy();
    expect(view.$('.no_vis').hasClass('active')).toBeTruthy();

    router.model.set({ model: 'tables', exclude_shared: true });
    tables.total_entries = 0;
    tables.reset();

    expect(view.$('.tables').hasClass('active')).toBeFalsy();
    expect(view.$('.no_tables').hasClass('active')).toBeTruthy();
  });

  it("should show more data block when user doesn't have more than 3 tables", function() {
    router.model.set({ model: 'tables' }, { silent: true });
    tables.total_entries = 1;
    tables.reset([{ id:'test_id', name: 'name' }]);
    expect(view.$('.more_data').hasClass('active')).toBeTruthy();

    router.model.set({ model: 'tables' }, { silent: true });
    tables.total_entries = 4;
    tables.reset([{ id:'test_id', name: 'name' }, { id:'test_id2', name: 'name2' }, { id:'test_id3', name: 'name3' }, { id:'test_id4', name: 'name4' }]);
    expect(view.$('.more_data').hasClass('active')).toBeFalsy();

    router.model.set({ model: 'tables' }, { silent: true });
    tables.total_entries = 0;
    tables.reset();
    expect(view.$('.more_data').hasClass('active')).toBeFalsy();

    router.model.set({ model: 'visualizations' }, { silent: true });
    visualizations.total_entries = 0;
    visualizations.reset();
    expect(view.$('.more_data').hasClass('active')).toBeFalsy();
  });

  it("should send create table trigger when clicks over create_new buttons", function() {
    spyOn(view, '_showTableCreationDialog');
    router.model.set({ model: 'tables' }, { silent: true });
    view.$('a.create_new').click();
    expect(view._showTableCreationDialog).not.toHaveBeenCalled();
  });

  it("should show create vis dialog", function() {
    spyOn(view, '_showVisCreationDialog');
    router.model.set({ model: 'visualizations' }, { silent: true });
    view.$('a.create').click();
    expect(view._showVisCreationDialog).not.toHaveBeenCalled();
  });

});