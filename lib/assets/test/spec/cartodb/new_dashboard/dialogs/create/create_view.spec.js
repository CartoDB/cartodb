var CreateDialogView = require('new_common/dialogs/create/create_view');
// var Backbone = require('backbone');
// var $ = require('jquery');

describe('new_dashboard/dialog/create_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'paco'
    });

    this.view = new CreateDialogView({
      user: this.user,
      type: 'map'
    });
    
    this.view.render();
  });

  it('should render correctly', function() {
    expect(this.view.$('.CreateDialog-header').length).toBe(1);
    expect(this.view.$('.CreateDialog-body').length).toBe(1);
    expect(this.view.$('.CreateDialog-footer').length).toBe(1);
    expect(this.view.$('.CreateDialog-templates').length).toBe(1);
    expect(this.view.$('.CreateDialog-preview').length).toBe(1);
    expect(this.view.$('.CreateDialog-listing').length).toBe(1);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
