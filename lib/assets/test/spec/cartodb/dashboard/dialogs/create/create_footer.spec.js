var CreateFooterView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_footer');
var CreateModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var MapTemplates = require('../../../../../../javascripts/cartodb/common/map_templates');

describe('dashboard/dialogs/create/create_footer_view', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco'
    });

    this.model = new CreateModel({
      type: "dataset",
      option: "listing"
    }, {
      user: this.user
    });

    this.view = new CreateFooterView({
      user: this.user,
      createModel: this.model,
      currentUserUrl: this.currentUserUrl
    });

    spyOn(this.model, 'bind').and.callThrough();

    this.view.render();
  });

  it('should not appear when option is templates', function() {
    this.model.set('option', 'templates');
    expect(this.view.$el.text().trim()).toBe('');
  });

  it('should render a text info with two buttons when option is preview', function() {
    this.model.setMapTemplate(new cdb.core.Model(MapTemplates[0]));
    expect(this.view.$('.CreateDialog-footerInfo').length).toBe(1);
    expect(this.view.$('.CreateDialog-footerActions a').length).toBe(1);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
