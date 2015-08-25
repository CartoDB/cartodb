var CreateFooterView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_footer');
var CreateModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var MapTemplates = require('../../../../../../javascripts/cartodb/common/map_templates');

describe('common/dialogs/create/create_footer_view', function() {
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

  it('should show start tutorial link when there is no datasets selected', function() {
    this.model.selectedDatasets.reset();
    this.view.render();
    expect(this.view.$el.text()).toContain('start with a video tutorial');
    expect(this.view.$('.js-videoTutorial').length).toBe(1);
    this.model.selectedDatasets.reset([{ hola: "hola" }]);
    this.view.render();
    expect(this.view.$el.text()).not.toContain('start with a video tutorial');
    expect(this.view.$('.js-videoTutorial').length).toBe(0);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
