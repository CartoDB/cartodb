var cdb = require('cartodb.js-v3');
var CreateContentView = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_content');
var CreateModel = require('../../../../../../javascripts/cartodb/common/dialogs/create/create_map_model');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');

describe('common/dialogs/create/create_content', function() {
  beforeEach(function() {

    this.user = new cdb.admin.User({
      base_url: 'http://paco.carto.com',
      username: 'paco'
    });

    this.model = new CreateModel({
      type: "map",
      option: "templates"
    }, {
      user: this.user
    });

    var $el = $('<div>').append(cdb.templates.getTemplate('common/views/create/dialog_template')());

    this.view = new CreateContentView({
      el: $el,
      user: this.user,
      model: this.model
    });

    this.view.render();
  });

  it('should render correctly', function() {
    expect(_.size(this.view._subviews)).toBe(5);
    expect(this.view.createPane).toBeDefined();
    expect(this.view.$('.Filters--navListing').length).toBe(1);
    expect(this.view.$('.CreateDialog-listing').length).toBe(1);
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
