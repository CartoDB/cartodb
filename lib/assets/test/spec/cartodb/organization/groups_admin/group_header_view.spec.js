var cdb = require('cartodb.js-v3');
var GroupHeaderView = require('../../../../../javascripts/cartodb/organization/groups_admin/group_header_view');

describe('organization/groups_admin/group_header_view', function() {

  beforeEach(function() {
    this.setupView = function() {
      this.group = new cdb.admin.Group();

      this.urls = {
        root: new cdb.common.Url({ base_url: 'fake-root-url' }),
        users: new cdb.common.Url({ base_url: 'fake-users-url' }),
        edit: new cdb.common.Url({ base_url: 'fake-edit-url' })
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

  describe('when group is new', function() {
    beforeEach(function() {
      this.setupView();
    });

    it('should render the fallback text as title', function() {
      expect(this.innerHTML()).toContain('Create new group');
    });

    it('should render back button to root', function() {
      expect(this.view.$('.Filters-group a.u-actionTextColor').attr('href')).toEqual('fake-root-url');
    });

    it('should not render the users tab', function() {
      expect(this.innerHTML()).not.toMatch("\sUser");
    });

    it("should not have leaks", function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when group already exist', function() {
    beforeEach(function() {
      this.setupView();
      this.group.set({
        id: 'g1',
        display_name: 'my group'
      });
    });

    it('should render the group display name as title', function() {
      expect(this.innerHTML()).toContain('my group');
    });

    it('should render back button to root', function() {
      expect(this.view.$('.Filters-group a.u-actionTextColor').attr('href')).toEqual('fake-root-url');
    });

    it('should render back button to users if is not on users url', function() {
      this.urls.users.isCurrent = false;
      this.view.render();
      expect(this.view.$('.Filters-group a.u-actionTextColor').attr('href')).toEqual('fake-users-url');
    });

    it('should render the menu', function() {
      expect(this.innerHTML()).toContain('User');
    });

    it('should only render users count if has any', function() {
      expect(this.innerHTML()).not.toContain('0 Users');
      this.group.users.reset([{}]);
      expect(this.innerHTML()).toContain('1 User');
      this.group.users.reset([{}, {}, {}]);
      expect(this.innerHTML()).toContain('3 Users');
    });

    it("should not have leaks", function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  afterEach(function() {
    this.view.clean();
  });

});
