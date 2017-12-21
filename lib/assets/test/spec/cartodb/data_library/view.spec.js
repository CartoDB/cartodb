var DataLibrary = require('../../../../javascripts/cartodb/data_library/main_view');
var cdbAdmin = require('cdb.admin');
var _ = require('underscore-cdb-v3');

describe('data_library/view', function() {
  beforeEach(function() {
    this.ownerAttrs = {
      base_url: 'http://paco.carto.com',
      username: 'paco'
    };

    this.vis = new cdbAdmin.Visualization({
      account_host: 'carto.com',
      date: '2014-09-08T09:51:33+00:00',
      id: 'b718d53c-373d-11e4-add2-0e8d2b608a14',
      permission: {
        owner: this.ownerAttrs
      },
      table: {
        size: 49152,
        geometry_types: ['point']
      }
    });

    this.view = new DataLibrary({
      el: this.$map
    });

    this.collection = this.view.collection;
  });

  describe('render', function() {
    it('should render properly', function() {
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(7);
    });

    it('should have no leaks', function() {
      this.view.render();
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('collection changes', function() {
    it('should show list when collection fetch works', function() {
      this.collection.reset([ this.vis ]);
      expect(this.view._isBlockEnabled('list')).toBeTruthy();
      expect(this.view._isBlockEnabled('main_loader')).toBeFalsy();
      expect(_.size(this.view.enabledViews)).toBe(1);
    });

    it('should show error block when collection fetch fails', function() {
      this.collection.trigger('loading');
      expect(this.view._isBlockEnabled('error')).toBeFalsy();
      this.collection.trigger('error');
      expect(this.view._isBlockEnabled('error')).toBeTruthy();
      expect(this.view._isBlockEnabled('list')).toBeFalsy();
      expect(_.size(this.view.enabledViews)).toBe(1);
    });

    it('should show empty datasets when user didn\'t have any dataset', function() {
      this.collection.total_user_entries = 0;
      this.collection.reset([]);
      expect(this.view._isBlockEnabled('no_results')).toBeTruthy();
    });
  });

  it('should hide the load more button when the limit is reached', function() {
    var c = [];

    for (var i = 0; i <= 12; i++) {
      c.push(this.vis);
    }

    this.collection.reset(c);

    this.view.$el.find(".js-more").click();
    expect(this.view.model.get('show_more')).toBeFalsy();
    expect(this.view.$('.js-more').hasClass('is-hidden')).toBeTruthy();
  });

  it('should define a model', function() {
    expect(this.view.model).toBeDefined();
    expect(this.view.model.get('vis_count')).toBeDefined();
  });

  afterEach(function() {
    this.view.clean();
  });
});
