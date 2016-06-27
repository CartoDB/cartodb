var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var AddOrRemoveGroupUsersFiltersExtraView = require('../../../../../javascripts/cartodb/organization/groups_admin/add_or_remove_group_users_filters_extra_view');
var AddGroupUsersView = require('../../../../../javascripts/cartodb/common/dialogs/add_group_users/add_group_users_view.js');

describe('organization/groups_admin/add_or_remove_group_users_filters_extra_view', function() {

  beforeEach(function() {
    this.user = new cdb.admin.User({
      id: 'user-id',
      username: 'pepe',
      actions: {},
      organization: {
        id: 'org-id',
        users: [{
          id: 'abc-123',
          username: 'paco'
        },
        {
          id: 'abc-456',
          username: 'pepe'
        }]
      }
    });

    this.group = new cdb.admin.Group({
      id: 'g1',
      organization: this.user.organization,
      users: [{
        id: 'u1',
        username: 'pachi'
      }]
    });

    spyOn(AddGroupUsersView.prototype, 'initialize').and.callThrough();

    this.view = new AddOrRemoveGroupUsersFiltersExtraView({
      group: this.group,
      orgUsers: this.user.organization.users
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should not open dialog to add users just yet', function() {
    expect(AddGroupUsersView.prototype.initialize).not.toHaveBeenCalled();
  });

  it('should show the add users button', function() {
    expect(this.view.$('.js-add-users').attr('style')).toBeUndefined()
    expect(this.view.$('.js-rm-users').attr('style')).toContain('display: none');
  });

  describe('when click add', function() {
    beforeEach(function() {
      this.view.$('.js-add-users').click();
    });

    it('should open dialog to add users', function() {
      expect(AddGroupUsersView.prototype.initialize).toHaveBeenCalled();
    });
  });

  describe('when at least one user is selected', function() {
    beforeEach(function() {
      this.group.users.first().set('selected', true);
    });

    it('should change the subheader to show remove button', function() {
      expect(this.view.$('.js-add-users').attr('style')).toContain('display: none');
      expect(this.view.$('.js-rm-users').attr('style')).not.toContain('none');
    });

    describe('when click remove', function() {
      beforeEach(function() {
        jasmine.clock().install(); // due to modal animations
        this.jqXHR = $.Deferred();
        spyOn(this.group.users, 'removeInBatch').and.returnValue(this.jqXHR);
        this.view.$('.js-rm-users').click();
        jasmine.clock().tick(1000);
      });

      afterEach(function() {
        jasmine.clock().uninstall();
      });

      it('should call group users collection to remove them in batch', function() {
        expect(this.group.users.removeInBatch).toHaveBeenCalled();
        expect(this.group.users.removeInBatch).toHaveBeenCalledWith(jasmine.any(Array));
        expect(this.group.users.removeInBatch).toHaveBeenCalledWith(['u1']);
      });

      it('should show removing users loader in a modal', function() {
        expect($('.Dialog').text()).toContain('Removing users');
      });

      describe('when users are removed', function() {
        beforeEach(function() {
          this.jqXHR.resolve();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function() {
          expect($('.Dialog').length).toEqual(0);
        });
      });

      describe('when fails to remove users', function() {
        beforeEach(function() {
          this.jqXHR.reject();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function() {
          expect($('.Dialog').text()).not.toContain('Removing users');
        });

        it('should show error modal', function() {
          expect($('.Dialog').text()).toContain('error');
        });
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });

});
