var ItemView = require('new_dashboard/datasets/datasets_item');
var Router = require('new_dashboard/router');

describe('new_dashboard/datasets/datasets_item', function() {
  beforeEach(function() {
    spyOn(cdb.config, 'prefixUrl')
    cdb.config.prefixUrl.and.returnValue('/u/pepe');

    this.table = {
      row_count: 9000
    };

    this.dataset = new cdb.admin.CartoDBTableMetadata({
      name: 'my_dataset',
      privacy: 'PRIVATE',
      updated_at: (new Date()).toISOString(),
      likes: 42,
      table: this.table
    });

    spyOn(this.dataset, 'on');

    this.user = new cdb.admin.User({});

    this.router = new Router();
    this.router.model.set('model', 'datasets');

    this.view = new ItemView({
      model: this.dataset,
      user: this.user,
      router: this.router,
      template_base: 'new_dashboard/header/settings_dropdown'
    });


    this.html = 'call this.renderView(); in your test case!';
    this.renderView = function() {
      this.view.render();
      this.html = this.view.el.innerHTML;
    };
  });

  it('should have no leaks', function() {
    this.renderView();
    expect(this.view).toHaveNoLeaks();
  });

  it('should render if dataset changes', function() {
    expect(this.dataset.on).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  it('should render the name', function() {
    this.renderView();
    expect(this.html).toContain('my_dataset');
  });

  it('should render the URL to dataset', function() {
    this.renderView();
    // TODO: need to be updated once we have the new dataset page
    expect(this.html).toContain('/u/pepe/tables/my_dataset');
  });

  it('should render likes count', function() {
    this.renderView();
    expect(this.html).toContain('42');
  });

  it('should render rows count', function() {
    this.renderView();
    expect(this.html).toContain('9,000 Rows');
  });

  it('should render privacy', function() {
    this.renderView();
    expect(this.html).toContain('private');
  });

  it('should render timediff', function() {
    this.renderView();
    expect(this.html).toContain('a few seconds ago');
  });

  describe('given row_count is not set', function() {
    beforeEach(function() {
      delete this.table.row_count
    });

    it('should render 0 rows', function() {
      this.renderView();
      expect(this.html).toContain('0 Rows');
    });
  });

  describe('given dataset is selected', function() {
    beforeEach(function() {
      this.dataset.set('selected');
      this.renderView();
      expect(this.html).toContain('DatasetsItem is--selected');
    });
  });

  describe('given description is set', function() {
    beforeEach(function() {
      this.dataset.set('description', 'my desc');
    });

    it('should show description', function() {
      this.renderView();
      expect(this.html).toContain('my desc');
    });

    it('should not show link to add a description', function() {
      this.renderView();
      expect(this.html).not.toContain('Add a description...');
    });
  });

  describe('given description is not set', function() {
    it('should show link to add a description', function() {
      this.renderView();
      expect(this.html).toContain('Add a description...');

      // Empty string too
      this.dataset.set('description', '');
      this.renderView();
      expect(this.html).toContain('Add a description...');
    });
  });

  describe('given user owns dataset', function() {
    beforeEach(function() {
      spyOn(this.dataset.permission, 'isOwner').and.returnValue(true);
    });

    it('should not render permission indicator', function() {
      this.renderView();
      expect(this.html).not.toContain('PermissionIndicator');
      expect(this.html).not.toContain('READ');
    });

    it('should not render user avatar', function() {
      expect(this.html).not.toContain('UserAvatar');
    });
  });

  describe('given user does NOT own dataset', function() {
    beforeEach(function() {
      spyOn(this.dataset.permission, 'isOwner').and.returnValue(false);
    });

    it('should render user avatar', function() {
      this.renderView();
      expect(this.html).toContain('UserAvatar');
    });

    describe('and permission is set to read only', function() {
      beforeEach(function() {
        spyOn(this.dataset.permission, 'getPermission').and.returnValue(cdb.admin.Permission.READ_ONLY);
      });

      it('should render permission indicator', function() {
        this.renderView();
        expect(this.dataset.permission.getPermission).toHaveBeenCalledWith(this.user);
        expect(this.html).toContain('READ');
        expect(this.html).toContain('PermissionIndicator');
      });
    });
  });

  describe('given there are no tags', function() {
    it('should render a link to add tags', function() {
      this.renderView();
      expect(this.html).toContain('Add tags...');
    });
  });

  describe('given there are at least one tag', function() {
    beforeEach(function() {
      this.dataset.set('tags', ['ole', 'dole', 'doff', 'kinke', 'lane', 'koff']);
    });

    it('should only render first three', function() {
      this.renderView();
      expect(this.html).toContain('ole');
      expect(this.html).toContain('dole');
      expect(this.html).toContain('doff');
      expect(this.html).not.toContain('kinke');
      expect(this.html).not.toContain('lane');
      expect(this.html).not.toContain('koff');
    });

    it('should render a text of how many tags remain', function() {
      this.renderView();
      expect(this.html).toContain('and 3 more');
    });

    it('each tag should have a URL to the tag', function() {
      this.renderView();
      expect(this.html).toContain('tag/ole');
      expect(this.html).toContain('tag/dole');
      expect(this.html).toContain('tag/doff');
    });
  });

  describe('click item', function() {
    beforeEach(function() {
      spyOn(this.view, 'killEvent');
      this.renderView();

    });
    describe('given clicked element is a link (e.g. dataset title)', function() {
      beforeEach(function() {
        this.view.$('a').click();
      });

      it('should let the link be handled as normal', function() {
        expect(this.view.killEvent).not.toHaveBeenCalled();
      });
    });

    describe('given clicked target is NOT a link', function() {
      beforeEach(function() {
        this.clickEl = function() {
          this.view.$el.click();
        };
        this.clickEl();
      });

      it('should kill default event behaviour', function() {
        expect(this.view.killEvent).toHaveBeenCalledWith(this.view.killEvent.calls.argsFor(0)[0]);
      });

      it('should toggle selected state on dataset', function() {
        expect(this.dataset.get('selected')).toBeTruthy();

        this.clickEl();
        expect(this.dataset.get('selected')).toBeFalsy();
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
