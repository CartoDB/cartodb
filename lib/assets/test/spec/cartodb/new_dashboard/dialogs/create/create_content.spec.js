var cdb = require('cartodb.js');
var CreateContentView = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_content');
var CreateModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_model');
var _ = require('underscore');
var $ = require('jquery');
var UserUrl = require('../../../../../../javascripts/cartodb/new_common/urls/user_model');

describe('new_dashboard/dialog/create/create_content', function() {
  beforeEach(function() {

    this.user = new cdb.admin.User({
      username: 'paco'
    });

    this.currentUserUrl = new UserUrl({
      user: this.user,
      account_host: 'paco'
    });

    this.model = new CreateModel({
      type: "map",
      option: "templates"
    }, {
      user: this.user
    });

    var $el = $('<div>').append(cdb.templates.getTemplate('new_common/views/create/dialog_template')());

    this.view = new CreateContentView({
      el: $el,
      user: this.user,
      model: this.model,
      currentUserUrl: this.currentUserUrl
    });

    this.view.render();
  });

  it('should render correctly', function() {
    expect(_.size(this.view._subviews)).toBe(4);
    expect(this.view.createPane).toBeDefined();
    expect(this.view.$('.CreateDialog-templates').length).toBe(1);
    expect(this.view.$('.CreateDialog-preview').length).toBe(1);
    expect(this.view.$('.CreateDialog-listing').length).toBe(1);
  });

  it('should not render templates and preview when type is dataset', function() {
    this.model.set({
      type: 'dataset',
      option: 'listing'
    });
    this.view.render();
    expect(this.view.$('.CreateDialog-templates').length).toBe(0);
    expect(this.view.$('.CreateDialog-preview').length).toBe(0);
    expect(this.view.$('.CreateDialog-listing').html()).not.toBe('');
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
