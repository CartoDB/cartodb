var cdb = require('cartodb.js');
var CreateContentView = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_content');
var CreateModel = require('../../../../../../javascripts/cartodb/new_common/dialogs/create/create_model');
var _ = require('underscore');
var $ = require('jquery');

describe('new_dashboard/dialogs/create/create_content', function() {
  beforeEach(function() {

    this.user = new cdb.admin.User({
      base_url: 'http://paco.cartodb.com',
      username: 'paco'
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
      model: this.model
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
