var cdb = require('cartodb.js');
var EditGroupView = require('../../../../javascripts/cartodb/organization_groups/edit_group_view');
var Router = require('../../../../javascripts/cartodb/organization_groups/router');

describe('organization_groups/edit_group_view', function() {

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

    var groups = new cdb.admin.OrganizationGroups([{
      id: 'g1',
      display_name: 'my group'
    }], {
      organization: user.organization
    });

    this.router = new Router({
      rootUrl: new cdb.common.Url({
        base_url: 'http://cartodb.com/user/paco/organization/groups'
      }),
      groups: groups
    });

    this.group = groups.newGroupById('g1');
    spyOn(this.group, 'fetch');

    spyOn(EditGroupView.prototype, 'initialize').and.callThrough();
    this.view = new EditGroupView({
      router: this.router,
      group: this.group
    });
    this.view.render();
  });

  describe('when group is not yet fetched', function() {
    beforeEach(function() {
      this.group.clear();
      this.group.set({
        id: 'has_only_fake_id'
      });
      this.view.initialize(EditGroupView.prototype.initialize.calls.argsFor(0)[0]);
      this.view.render();
    });

    it('should show loading until fetched', function() {
      expect(this.innerHTML()).toContain('Loading');
    });

    describe('when fetched successfully', function() {
      beforeEach(function() {
        // fake set response
        this.group.set({
          display_name: 'my group'
        });
        this.group.fetch.calls.argsFor(0)[0].success();
      });

      it('should show form', function() {
        expect(this.view.$('input').length > 0).toBe(true);
      });
    });

    describe('when fetched fails (e.g. non-existing)', function() {
      beforeEach(function() {
        spyOn(this.router, 'navigate');
        this.group.fetch.calls.argsFor(0)[0].error();
      });

      it('should redirect back to groups index', function() {
        expect(this.router.navigate).toHaveBeenCalled();
      });
    });
  });

  describe('when group is already fetched', function() {
    it('should render input', function() {
      expect(this.innerHTML()).not.toContain('Loading');
      expect(this.view.$('input').length > 0).toBe(true);
    });
  });

  describe('when click save', function() {
    beforeEach(function() {
      spyOn(this.group, 'save');
    });

    it('should not try to save group if has no name', function() {
      this.view.$('.js-name').val('');
      this.view.$('.js-save').click();
      expect(this.group.save).not.toHaveBeenCalled();
    });

    describe('when has changed name', function() {
      beforeEach(function() {
        this.view.$('.js-name').val('new name');
        this.view.$('.js-save').click();
      });

      it('should try to save group', function() {
        expect(this.group.save).toHaveBeenCalled();
        expect(this.group.save).toHaveBeenCalledWith({
          display_name: 'new name'
        }, jasmine.any(Object));
      });

      it('should show loading meanwhile', function() {
        expect(this.innerHTML()).toContain('Saving');
      });

      it('should not add to collection until got succesful response', function() {
        expect(this.group.save.calls.argsFor(0)[1].wait).toBe(true);
      });

      describe('when save succeeds', function() {
        beforeEach(function() {
          this.group.set({
            id: 'g1'
          });
          spyOn(this.router, 'navigate');
          this.group.save.calls.argsFor(0)[1].success();
        });

        it('should navigate to groups root', function() {
          expect(this.router.navigate).toHaveBeenCalled();
          expect(this.router.navigate.calls.argsFor(0)[0]).toMatch('/groups/g1');
        });
      });

      describe('when save fails', function() {
        beforeEach(function() {
          this.group.save.calls.argsFor(0)[1].error();
        });

        it('should show form again', function() {
          expect(this.view.$('input').length > 0).toBe(true);
        });
      });
    });
  });

  describe('when click delete group', function() {
    beforeEach(function() {
      spyOn(this.group, 'destroy');
      this.view.$('.js-delete').click();
    });

    it('should change to loading while destroying', function() {
      expect(this.innerHTML()).toContain('Deleting');
    });

    it('should not remove from collection until response confirms it deleteted', function() {
      expect(this.group.destroy.calls.argsFor(0)[0].wait).toBe(true);
    });

    describe('when deleted', function() {
      beforeEach(function() {
        spyOn(this.router, 'navigate');
        this.group.destroy.calls.argsFor(0)[0].success();
      });

      it('should redirect to groups index', function() {
        expect(this.router.navigate).toHaveBeenCalled();
        expect(this.router.navigate.calls.argsFor(0)[0]).toMatch('/groups');
      });
    });

    describe('when deletion fails', function() {
      beforeEach(function() {
        this.group.destroy.calls.argsFor(0)[0].error();
      });

      it('should show form again', function() {
        expect(this.view.$('input').length > 0).toBe(true);
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
