var cdb = require('cartodb.js');
var GroupHeaderView = require('../../../../javascripts/cartodb/organization_groups/group_header_view');
var Router = require('../../../../javascripts/cartodb/organization_groups/router');

describe('organization_groups/group_header_view', function() {

  beforeEach(function() {
    this.setupView = function() {
      this.group = new cdb.admin.Group();

      this.urls = {
        root: new cdb.common.Url({ base_url: 'fake-root-url' }),
        show: new cdb.common.Url({ base_url: 'fake-show-url' }),
        edit: new cdb.common.Url({ base_url: 'fake-edit-url' })
      };
      this.urls.show.isCurrent = true;

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
      expect(this.view.$('h3').text()).toEqual('Create new group');
    });

    it('should render back button to root', function() {
      expect(this.view.$('.NavButton--back').attr('href')).toEqual('fake-root-url');
    });

    it('should not render the menu', function() {
      expect(this.innerHTML()).not.toContain('Users');
      expect(this.innerHTML()).not.toContain('Settings');
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
      expect(this.view.$('h3').text()).toEqual('my group');
    });

    it('should render back button to root', function() {
      expect(this.view.$('.NavButton--back').attr('href')).toEqual('fake-root-url');
    });

    it('should render back button to show if is not on show url', function() {
      this.urls.show.isCurrent = false;
      this.view.render();
      expect(this.view.$('.NavButton--back').attr('href')).toEqual('fake-show-url');
    });

    it('should render the menu', function() {
      expect(this.innerHTML()).toContain('Users');
      expect(this.innerHTML()).toContain('Settings');
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
