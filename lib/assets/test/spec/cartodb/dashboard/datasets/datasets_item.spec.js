var ItemView = require('../../../../../javascripts/cartodb/dashboard/datasets/datasets_item');
var SyncView = require('../../../../../javascripts/cartodb/common/dialogs/sync_dataset/sync_dataset_view');
var Router = require('../../../../../javascripts/cartodb/dashboard/router');
var cdb = require('cartodb.js-v3');

describe('dashboard/datasets/datasets_item', function() {
  beforeEach(function() {
    this.tablemetadata = {
      name:           '"paco".my_dataset',
      row_count:      9000,
      size:           1000,
      geometry_types: ['st_point']
    };

    this.vis = new cdb.admin.Visualization({
      name: 'my_dataset',
      type: 'table',
      privacy: 'PRIVATE',
      updated_at: (new Date()).toISOString(),
      likes: 42,
      table: this.tablemetadata,
      permission: {
        owner: {
          base_url: 'http://team.carto.com/u/paco',
          username: 'paco'
        }
      }
    });

    spyOn(this.vis, 'on').and.callThrough();

    this.user = new cdb.admin.User({
      base_url: 'http://team.carto.com/u/pepe',
      username: 'pepe'
    });

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
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

  it('should be a bind listening vis changes', function() {
    var args = this.vis.on.calls.argsFor(0);
    expect(args[0]).toEqual('change');
    expect(args[1]).toEqual(this.view.render);
    expect(args[2]).toEqual(this.view);
  });

  it('should render the title', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('my_dataset');
  });

  it('should render the URL to dataset, from the perspective of current user', function() {
    this.renderView();
    // TODO: need to be updated once we have the new dataset page
    expect(this.innerHTML()).toContain('http://team.carto.com/u/pepe/tables/paco.my_dataset');
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
    expect($(this.innerHTML()).find('.js-sizeIndicator').length).toBe(1);
    expect($(this.innerHTML()).find('.js-sizeIndicator').text()).toContain('1000 bytes');
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
    expect(this.view.$('.DatasetsList-itemStatus').hasClass('CDB-IconFont')).toBeTruthy();
    expect(this.view.$('.DatasetsList-itemStatus').hasClass('is-success')).toBeTruthy();
  });

  it('should render sync and public dataset info', function() {
    this.renderView();
    expect(this.view.$('.DatasetsList-itemStatus').length).toBe(0);
    this.vis.set('synchronization', { from_external_source: true, state: 'success', run_at: '2012-2-2' });
    this.renderView();
    expect(this.view.$('.DatasetsList-aditionalItemStatus').length).toBe(1);
    expect(this.view.$('.DatasetsList-itemStatus').length).toBe(2);
    expect(this.view.$('.DatasetsList-itemStatus').hasClass('CDB-IconFont')).toBeTruthy();
    expect(this.view.$('.DatasetsList-itemStatus').hasClass('is-success')).toBeTruthy();
  });

  it('should render an editable field with the description', function() {
    this.vis.set('description', 'my desc');
    this.renderView();
    expect(this.view.$('.DatasetsList-itemDescription.EditableField').length).toBe(1);
    expect(this.view.$('.js-description').length).toBe(1);
    expect(this.view.$('.js-description')[0].textContent).toEqual('my desc');
  });

  it('should render an editable field with the tags', function() {
    this.vis.set('tags', ['tag1']);
    this.renderView();
    expect(this.view.$('.js-item-tags').length).toBe(1);
    expect(this.view.$('.js-tag-link').length).toBe(1);
    expect(this.view.$('.js-tag-link')[0].textContent.trim()).toEqual('tag1');
  });

  it('should be able to select the model', function() {
    this.renderView();
    this.view.$el.click();
    expect(this.view.$el.hasClass('is--selected')).toBeTruthy();
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
      this.vis.tableMetadata().unset('row_count');
    });

    it('should not render row count', function() {
      this.renderView();
      expect(this.innerHTML()).not.toContain('Rows');
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

    describe('and do not have write access', function() {
      beforeEach(function() {
        spyOn(this.vis.permission, 'hasWriteAccess').and.returnValue(false);
      });

      it('should render read-only indicator', function() {
        this.renderView();
        expect(this.vis.permission.hasWriteAccess).toHaveBeenCalledWith(this.user);
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

  describe('when click .js-sync', function() {
    beforeEach(function() {
      this.vis.set('synchronization', {
        ran_at: '20150818',
        state: 'synced'
      });
      this.renderView();
      spyOn(SyncView.prototype, 'initialize').and.callThrough();
      spyOn(SyncView.prototype, 'appendToBody');
      this.view.$('.js-sync').click();
    });

    it('should create a sync dialog and append to body', function() {
      expect(SyncView.prototype.appendToBody).toHaveBeenCalled();
    });

    it('should create dialog w/ vis table', function() {
      expect(SyncView.prototype.initialize).toHaveBeenCalledWith(jasmine.objectContaining({
        table: this.view.model.tableMetadata()
      }));
    });
  });

  describe('when click .js-sync in a synced dataset', function() {
    beforeEach(function() {
      this.vis.set('synchronization', {
        ran_at: '20150818',
        state: 'synced',
        from_external_source: true
      });
      this.renderView();
      spyOn(SyncView.prototype, 'initialize').and.callThrough();
      spyOn(SyncView.prototype, 'appendToBody');
      this.view.$('.js-sync').click();
    });

    it('shouldn\'t create a sync dialog and append to body', function() {
      expect(SyncView.prototype.appendToBody).not.toHaveBeenCalled();
    });

    it('shouldn\'t create dialog w/ vis table', function() {
      expect(SyncView.prototype.initialize).not.toHaveBeenCalledWith(jasmine.objectContaining({
        table: this.view.model.tableMetadata()
      }));
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
