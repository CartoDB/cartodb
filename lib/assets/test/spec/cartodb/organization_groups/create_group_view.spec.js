var cdb = require('cartodb.js');
var CreateGroupView = require('../../../../javascripts/cartodb/organization_groups/create_group_view');
var Router = require('../../../../javascripts/cartodb/organization_groups/router');

describe('organization_groups/create_group_view', function() {

  beforeEach(function() {
    var user = new cdb.admin.User({
      id: 123,
      base_url: 'http://cartodb.com/user/paco',
      username: 'paco',
      organization: {
        owner: {
          id: 123
        }
      }
    });

    var groups = new cdb.admin.OrganizationGroups([], {
      organization: user.organization
    });

    this.router = new Router({
      rootUrl: new cdb.common.Url({
        base_url: 'http://cartodb.com/user/paco/organization/groups'
      }),
      groups: groups
    });

    this.view = new CreateGroupView({
      router: this.router,
      groups: groups
    });
    this.view.render();
  });

  it('should render input', function() {
    expect(this.view.$('input').length > 0).toBe(true);
  });

  describe('when click create group', function() {
    beforeEach(function() {
      spyOn(cdb.admin.OrganizationGroups.prototype, 'create');
    });

    it('should not try to save group if has no name', function() {
      this.view.$('.js-create').click();
      expect(cdb.admin.OrganizationGroups.prototype.create).not.toHaveBeenCalled();
    });

    describe('when has written a name', function() {
      beforeEach(function() {
        this.view.$('.js-name').val('foobar');
        this.view.$('.js-create').click();
      });

      it('should try to create group', function() {
        expect(cdb.admin.OrganizationGroups.prototype.create).toHaveBeenCalled();
      });

      it('should show loading meanwhile', function() {
        expect(this.innerHTML()).toContain('Creating group');
      });

      it('should not add to collection until got response', function() {
        expect(cdb.admin.OrganizationGroups.prototype.create.calls.argsFor(0)[1].wait).toBe(true);
      });

      describe('when create succeeds', function() {
        beforeEach(function() {
          spyOn(this.router, 'navigate');
          cdb.admin.OrganizationGroups.prototype.create.calls.argsFor(0)[1].success();
        });

        it('should navigate to groups root', function() {
          expect(this.router.navigate).toHaveBeenCalled();
          expect(this.router.navigate.calls.argsFor(0)[0]).toMatch('/groups');
        });
      });

      describe('when create fails', function() {
        beforeEach(function() {
          cdb.admin.OrganizationGroups.prototype.create.calls.argsFor(0)[1].error();
        });

        it('should show form again with errors', function() {
          expect(this.innerHTML()).not.toContain('Creating group');
        });
      });
    });

  });

  it("should not have leaks", function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });

});
