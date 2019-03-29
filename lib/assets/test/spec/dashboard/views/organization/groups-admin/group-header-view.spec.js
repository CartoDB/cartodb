const GroupHeaderView = require('dashboard/views/organization/groups-admin/group-header/group-header-view');
const GroupModel = require('dashboard/data/group-model');
const UrlModel = require('dashboard/data/url-model');
const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/views/organization/groups-admin/group-header-view', function () {
  beforeEach(function () {
    this.setupView = function () {
      this.group = new GroupModel({}, { configModel });

      this.urls = {
        root: new UrlModel({ base_url: 'fake-root-url' }),
        users: new UrlModel({ base_url: 'fake-users-url' }),
        edit: new UrlModel({ base_url: 'fake-edit-url' })
      };
      this.urls.users.isCurrent = true;

      spyOn(GroupHeaderView.prototype, 'initialize').and.callThrough();
      this.view = new GroupHeaderView({
        group: this.group,
        urls: this.urls
      });
      this.view.render();
    };
  });

  describe('when group is new', function () {
    beforeEach(function () {
      this.setupView();
    });

    it('should render the fallback text as title', function () {
      expect(this.innerHTML()).toContain('Create new group');
    });

    it('should render back button to root', function () {
      expect(this.view.$('.Filters-group a.u-actionTextColor').attr('href')).toEqual('fake-root-url');
    });

    it('should not render the users tab', function () {
      expect(this.innerHTML()).not.toMatch('\sUser');
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when group already exist', function () {
    beforeEach(function () {
      this.setupView();
      this.group.set({
        id: 'g1',
        display_name: 'my group'
      });
    });

    it('should render the group display name as title', function () {
      expect(this.innerHTML()).toContain('my group');
    });

    it('should render back button to root', function () {
      expect(this.view.$('.Filters-group a.u-actionTextColor').attr('href')).toEqual('fake-root-url');
    });

    it('should render back button to users if is not on users url', function () {
      this.urls.users.isCurrent = false;
      this.view.render();
      expect(this.view.$('.Filters-group a.u-actionTextColor').attr('href')).toEqual('fake-users-url');
    });

    it('should render the menu', function () {
      expect(this.innerHTML()).toContain('User');
    });

    it('should only render users count if has any', function () {
      expect(this.innerHTML()).not.toContain('0 Users');
      this.group.users.reset([{}]);
      expect(this.innerHTML()).toContain('1 User');
      this.group.users.reset([{}, {}, {}]);
      expect(this.innerHTML()).toContain('3 Users');
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
