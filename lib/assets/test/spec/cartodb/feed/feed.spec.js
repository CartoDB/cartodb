var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Feed = require('../../../../javascripts/cartodb/user_feed/view');
var Visualizations = require('../../../../javascripts/cartodb/user_feed/feed_collection');

describe('feed/view', function() {

  afterEach(function() {
    $('.js-feed').remove();
  });

  beforeEach(function() {

    cdb.config.set('url_prefix', 'base_url');

    Visualizations.prototype.sync = function(a, b, opts) {
      var c = [];
      c.push({
        id: 1, name: 'vis_name', likes: 1234, updated_at: '2015-10-11', table: { geometry_types: ['ST_Point'] },
        permission: { owner: { username: 'javier', avatar_url: 'http://avatar.url', map_count: 10 } }
      });

      c.push({
        id: 2, name: 'vis_name_2', likes: 2134, updated_at: '2015-10-11', table: { geometry_types: ['ST_MultiPoint'] },
        permission: { owner: { username: 'javier', avatar_url: 'http://avatar.url', map_count: 20 } }
      });

      c.push({
        id: 3, name: 'vis_name_2', likes: 2134, updated_at: '2015-10-11', table: { geometry_types: ['ST_MultiPoint'] },
        permission: { owner: { username: 'javier', avatar_url: 'http://avatar.url', map_count: 20 } }
      });

      c.push({
        id: 4, name: 'vis_name_2', likes: 2134, updated_at: '2015-10-11', table: { geometry_types: ['ST_MultiPoint'] },
        permission: { owner: { username: 'javier', avatar_url: 'http://avatar.url', map_count: 20 } }
      });

      c.push({
        id: 5, name: 'vis_name_2', likes: 2134, updated_at: '2015-10-11',
        table: { geometry_types: ['ST_MultiPoint'] },
        permission: { owner: { username: 'javier', avatar_url: 'http://avatar.url', map_count: 20 } }
      });

      opts.success({ visualizations: c.slice(0, 4), total_entries: c.length });
    };

    this.user = new cdb.admin.User({
      base_url: 'http://pepe.carto.com',
      username: 'pepe',
      account_type: 'FREE'
    });

    this.authenticatedUser = new cdb.open.AuthenticatedUser();
    this.authenticatedUser.set('username', this.user.get('username'));

    $('body').append('<div class="js-feed"></div>');

    this.view = new Feed({
      el: $('.js-feed'),
      authenticatedUser: this.authenticatedUser
    });

    spyOn(this.view, '_fetchLike');

    this.view.render();
  });

  it('should fetch a list of visualizations', function() {
    expect(this.view.el.innerHTML).toContain('vis_name');
    expect(this.view.el.innerHTML).toContain('vis_name_2');
  });

  it('should prepend the base_url to the links', function() {
    expect(this.view.$('.DefaultTitle-link:first').attr('href')).toContain('base_url');
  });


  it('should hide the load more button when the limit is reached', function() {
    this.view.$el.find(".js-more").click();
    expect(this.view.model.get('show_more')).toBeFalsy();
    expect(this.view.$('.js-more').hasClass('is-hidden')).toBeTruthy();
  });

  it('should define a model', function() {
    expect(this.view.model).toBeDefined();
    expect(this.view.model.get('vis_count')).toBeDefined();
    expect(this.view.model.get('size')).toBeDefined();
    expect(this.view.model.get('page')).toEqual(0);
    expect(this.view.model.get('order_by')).toEqual('likes');
  });

  it('should fetch the likes when the user is authenticated', function() {
    this.authenticatedUser.set({ username: 'skull' });
    expect(this.view._fetchLike).toHaveBeenCalled();
  });

  it('should allow to toggle the loader', function() {
    expect(this.view.loader).toBeDefined();
    this.view.model.set('show_loader', false);
    expect(this.view.loader.$el.css('display')).toEqual('none');
    this.view.model.set('show_loader', true);
    expect(this.view.loader.$el.css('display')).toEqual('block');
  });

  it('should allow to toggle the mast', function() {
    this.view.model.set('show_mast', false);
    expect(this.view.$('.js-mast').hasClass('is-hidden')).toBeTruthy();
    this.view.model.set('show_mast', true);
    expect(this.view.$('.js-mast').hasClass('is-hidden')).toBeFalsy();
  });
});
