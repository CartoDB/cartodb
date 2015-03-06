var ItemView = require('../../../../../javascripts/cartodb/new_dashboard/datasets/datasets_item');
var Router = require('../../../../../javascripts/cartodb/new_dashboard/router');
var UserUrl = require('../../../../../javascripts/cartodb/new_common/urls/user_model');
var cdb = require('cartodb.js');

describe('new_dashboard/datasets/datasets_item', function() {
  beforeEach(function() {
    this.tablemetadata = {
      name:           'my_dataset',
      row_count:      9000,
      size:           1000,
      geometry_types: ['st_point']
    };

    this.vis = new cdb.admin.Visualization({
      name: 'my_dataset',
      privacy: 'PRIVATE',
      updated_at: (new Date()).toISOString(),
      likes: 42,
      table: this.tablemetadata
    });

    spyOn(this.vis, 'on');

    this.user = new cdb.admin.User({
      username: 'pepe',
      account_host: 'host.ext'
    });

    this.router = new Router({
      currentUserUrl: new UserUrl({
        account_host: 'cartodb.com',
        user: this.user
      })
    });
    this.router.model.set('content_type', 'datasets');

    this.view = new ItemView({
      model: this.vis,
      user: this.user,
      router: this.router
    });

    this.renderView = function() {
      this.view.render();
    };
  });

  it('should have no leaks', function() {
    this.renderView();
    expect(this.view).toHaveNoLeaks();
  });

  it('should render if dataset changes', function() {
    expect(this.vis.on).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  it('should render the title', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('my_dataset');
  });

  it('should render the URL to dataset', function() {
    this.renderView();
    // TODO: need to be updated once we have the new dataset page
    expect(this.innerHTML()).toContain('/tables/my_dataset');
  });

  it('should render likes count', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('42');
  });

  it('should render row count', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('9,000 Rows');
  });

  it('should render table size', function() {
    this.renderView();
    expect($(this.innerHTML()).find('.SizeIndicator').length).toBe(1);
    expect($(this.innerHTML()).find('.SizeIndicator').text()).toContain('1000 bytes');
  });

  it('should render table geometry type', function() {
    this.renderView();
    expect(this.view.$('.DatasetsList-itemCategory').length).toBe(1);
    expect(this.view.$('.DatasetsList-itemCategory').hasClass('is--pointDataset')).toBeTruthy();
  });

  it('should render raster icon when dataset is raster', function() {
    this.vis.set('kind', 'raster');
    this.renderView();
    expect(this.view.$('.DatasetsList-itemCategory').length).toBe(1);
    expect(this.view.$('.DatasetsList-itemCategory').hasClass('is--pointDataset')).toBeFalsy();
    expect(this.view.$('.DatasetsList-itemCategory').hasClass('is--rasterDataset')).toBeTruthy();
  });

  it('should render privacy', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('private');
  });

  it('should render timediff', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('a few seconds ago');
  });

  it('should render sync info', function() {
    this.renderView();
    expect(this.view.$('.DatasetsList-itemStatus').length).toBe(0);
    this.vis.set('synchronization', { state: 'success', run_at: '2012-2-2' });
    this.renderView();
    expect(this.view.$('.DatasetsList-itemStatus').length).toBe(1);
    expect(this.view.$('.DatasetsList-itemStatus').hasClass('iconFont')).toBeTruthy();
    expect(this.view.$('.DatasetsList-itemStatus').hasClass('is-success')).toBeTruthy();
  });

  describe('given visualization is of kind raster', function() {
    beforeEach(function() {
      this.vis.set('kind', 'raster');
    });

    it('should title as a non-link disabled item', function() {
      this.renderView();
      expect(this.innerHTML()).not.toContain('/tables/my_dataset');
    });
  });

  describe('given row_count is not set', function() {
    beforeEach(function() {
      this.view.table.unset('row_count');
    });

    it('should not render row count', function() {
      this.renderView();
      expect(this.innerHTML()).not.toContain('Rows');
    });
  });

  describe('given dataset is selected', function() {
    beforeEach(function() {
      this.vis.set('selected');
      this.renderView();
      expect(this.innerHTML()).toContain('DatasetsItem is--selected');
    });
  });

  describe('given description is set', function() {
    beforeEach(function() {
      this.vis.set('description', 'my desc');
    });

    it('should show description', function() {
      this.renderView();
      expect(this.innerHTML()).toContain('my desc');
    });

    it('should not show link to add a description', function() {
      this.renderView();
      expect(this.innerHTML()).not.toContain('Add a description...');
    });
  });

  describe('given user owns dataset', function() {
    beforeEach(function() {
      spyOn(this.vis.permission, 'isOwner').and.returnValue(true);
    });

    it('should not render permission indicator', function() {
      this.renderView();
      expect(this.innerHTML()).not.toContain('PermissionIndicator');
      expect(this.innerHTML()).not.toContain('READ');
    });

    it('should not render user avatar', function() {
      expect(this.innerHTML()).not.toContain('UserAvatar');
    });
  });

  describe('given user does NOT own dataset', function() {
    beforeEach(function() {
      spyOn(this.vis.permission, 'isOwner').and.returnValue(false);
    });

    it('should render user avatar', function() {
      this.renderView();
      expect(this.innerHTML()).toContain('UserAvatar');
    });

    describe('and permission is set to read only', function() {
      beforeEach(function() {
        spyOn(this.vis.permission, 'getPermission').and.returnValue(cdb.admin.Permission.READ_ONLY);
      });

      it('should render permission indicator', function() {
        this.renderView();
        expect(this.vis.permission.getPermission).toHaveBeenCalledWith(this.user);
        expect(this.innerHTML()).toContain('READ');
        expect(this.innerHTML()).toContain('PermissionIndicator');
      });
    });
  });

  describe('given there are at least one tag', function() {
    beforeEach(function() {
      this.vis.set('tags', ['ole', 'dole', 'doff', 'kinke', 'lane', 'koff']);
    });

    it('should only render first three', function() {
      this.renderView();
      expect(this.innerHTML()).toContain('ole');
      expect(this.innerHTML()).toContain('dole');
      expect(this.innerHTML()).toContain('doff');
      expect(this.innerHTML()).not.toContain('kinke');
      expect(this.innerHTML()).not.toContain('lane');
      expect(this.innerHTML()).not.toContain('koff');
    });

    it('should render a text of how many tags remain', function() {
      this.renderView();
      expect(this.innerHTML()).toContain('and 3 more');
    });

    it('each tag should have a URL to the tag', function() {
      this.renderView();
      expect(this.innerHTML()).toContain('tag/ole');
      expect(this.innerHTML()).toContain('tag/dole');
      expect(this.innerHTML()).toContain('tag/doff');
    });
  });

  describe('click item', function() {
    describe('given clicked target is NOT a link', function() {
      beforeEach(function() {
        spyOn(this.view, 'killEvent');
        this.renderView();
        this.clickEl = function() {
          this.view.$el.click();
        };
        this.clickEl();
      });

      it('should kill default event behaviour', function() {
        expect(this.view.killEvent).toHaveBeenCalledWith(this.view.killEvent.calls.argsFor(0)[0]);
      });

      it('should toggle selected state on dataset', function() {
        expect(this.vis.get('selected')).toBeTruthy();

        this.clickEl();
        expect(this.vis.get('selected')).toBeFalsy();
      });
    });
  });

  describe('when click .js-privacy', function() {
    beforeEach(function() {
      this.renderView();
      cdb.god.bind('openPrivacyDialog', function(vis) {
        this.openendPrivacyDialog = vis;
      }, this);
      this.view.$('.js-privacy').click();
    });

    it('should call global event bus to open privacy dialog', function() {
      expect(this.openendPrivacyDialog).toBeTruthy();
    });

    it('should created dialog with selected items', function() {
      expect(this.openendPrivacyDialog).toEqual(this.vis);
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
