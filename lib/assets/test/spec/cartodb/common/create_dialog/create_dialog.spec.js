describe("Create dialog", function() {

  var view, user;

  afterEach(function() {
    view.clean();
  });

  beforeEach(function() {
    user = TestUtil.createUser('test');

    // Create a new dialog
    view = new cdb.common.CreateDialog({
      user:   user,
      data:   {},
      tabs:   ['layer', 'file', 'gdrive', 'dropbox', 'twitter', 'scratch', 'arcgis', 'success', 'error'],
      option: 'file',
      where:  'table'
    })
  });

  it('should render properly', function() {
    view.render();
    expect(view.$('.create-dialog-content').length).toBe(1);
    expect(view.$('.create-tab').length).toBe(9);
    expect(view.$('.create-panes > .import-pane').length).toBe(2); // Gdrive, dropbox, arcgis and twitter will be disabled
    expect(view.$('.create-panes .create-success').length).toBe(1);
    expect(view.$('.create-panes .create-error').length).toBe(1);
    expect(view.$('.create-panes .create-empty').length).toBe(1);
    expect(view.$('.create-progress').length).toBe(1);
  });

  it('should enable/disable "service panes" when user changes keys', function() {
    view.render();

    // Failed tabs
    expect(view.$('.create-tab.dropbox > a').hasClass('disabled')).toBeTruthy();
    expect(view.$('.create-tab.gdrive > a').hasClass('disabled')).toBeTruthy();
    expect(view.$('.import-service-pane').length).toBe(0);

    cdb.config.set({
      oauth_dropbox: true,
      oauth_gdrive: true
    });

    view.render();

    expect(view.$('.create-tab.gdrive > a').hasClass('disabled')).toBeFalsy();
    expect(view.$('.create-tab.dropbox > a').hasClass('disabled')).toBeFalsy();
    expect(view.$('.import-service-pane').length).toBe(2);
    expect(view.$('.create-panes > .import-pane').length).toBe(4);
  });

  it('should enable/disable "twitter pane" when user does not have enough rights', function() {
    cdb.config.set('datasource_search_twitter', 'asdf');

    user.set('twitter', { enabled: false });

    view.render();

    // Show message pane when user clicks over twitter tab
    expect(view.$('.create-tab.twitter > a').hasClass('disabled')).toBeFalsy();
    expect(view.$('.import-twitter-pane').length).toBe(0);
    expect(view.$('.twitter-message-pane').length).toBe(1);

    user.set('twitter', {
      enabled: true,
      block_price: null,
      block_size: null,
      hard_limit: true,
      monthly_use: 0,
      quota: 100000
    });

    // Without this the custom date picker throws an error, since it internally has a setTimeout to initialize the
    // date picker, this breaks because some (unrelated to this test) prerequisities are not there (DOM elements).
    // See line ~60-65 in custom_datepicker.js
    spyOn(window, 'setTimeout');

    view.render();

    expect(view.$('.create-tab.twitter > a').hasClass('disabled')).toBeFalsy();
    expect(view.$('.import-twitter-pane').length).toBe(1);
  });

  it('should disable "creation panes" when user has reached the limits', function() {
    cdb.config.set({
      oauth_dropbox: true,
      oauth_gdrive: true,
      datasource_search_twitter: true
    });

    // Infinite tables and bytes quota
    user.set({
      twitter: { enabled:false },
      table_quota: null,
      remaining_table_quota: 8,
      quota_in_bytes: null,
      remaining_byte_quota: 1000
    });
    view.render();
    expect(view.$('.create-tab > a.disabled').length).toBe(0);

    // Normal quota
    user.set({
      table_quota: 10,
      remaining_table_quota: 8,
      quota_in_bytes: 1024,
      remaining_byte_quota: 1000
    });
    view.render();
    expect(view.$('.create-tab > a.disabled').length).toBe(0);

    // Reaching one limit
    user.set({
      table_quota: 10,
      remaining_table_quota: 2,
      quota_in_bytes: 1024,
      remaining_byte_quota: -100
    });
    view.render();
    expect(view.$('.create-tab > a.disabled').length).toBe(6);

    // Reaching both limits
    user.set('remaining_table_quota', 0);
    view.render();
    expect(view.$('.create-tab > a.disabled').length).toBe(6);

    // Infinite with reaching limit
    user.set({
      table_quota: null,
      remaining_table_quota: 2,
      quota_in_bytes: 909090,
      remaining_byte_quota: -100
    });
    view.render();
    expect(view.$('.create-tab > a.disabled').length).toBe(6);
  });

  it('should activate the selected tab from the beginning', function() {
    view.render();

    expect(view.$('.create-tab a.file').hasClass('selected')).toBeTruthy();
    expect(view.$('.create-tab a.selected').length).toBe(1);

    var view2 = new cdb.common.CreateDialog({
      user:   user,
      data:   {},
      tabs:   ['layer', 'file', 'gdrive', 'dropbox', 'twitter', 'scratch', 'arcgis', 'success', 'error'],
      option: 'arcgis',
      where:  'tables'
    }).render();

    expect(view2.$('.create-tab a.arcgis').hasClass('selected')).toBeTruthy();
    expect(view2.$('.create-tab a.selected').length).toBe(1);
  });

  it('should not have leaks', function() {
    expect(view).toHaveNoLeaks();
  });

});
