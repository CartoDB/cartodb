var CreateFooterView = require('new_common/dialogs/create/create_footer');
var CreateModel = require('new_common/dialogs/create/create_model');
var MapTemplates = require('new_common/map_templates');

describe('new_dashboard/dialog/create/create_footer_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({ username: 'paco' });

    this.model = new CreateModel({
      type: "dataset",
      option: "listing"
    }, {
      user: this.user
    });

    this.view = new CreateFooterView({
      user: this.user,
      createModel: this.model
    });

    spyOn(this.model, 'bind').and.callThrough();
    
    this.view.render();
  });

  it('should not appear when option is templates', function() {
    this.model.set('option', 'templates');
    expect(this.view.$el.html()).toBe('');
  });

  it('should render a text info with two buttons when option is preview', function() {
    this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
    expect(this.view.$('.CreateDialog-footerInfo').length).toBe(1);
    expect(this.view.$('.CreateDialog-footerActions a').length).toBe(1);
    expect(this.view.$('.CreateDialog-footerActions button').length).toBe(1);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
