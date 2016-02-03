var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var EmptyGroupFiltersExtraView = require('../../../../../javascripts/cartodb/organization/groups_admin/empty_group_filters_extra_view');

describe('organization/groups_admin/empty_group_filters_extra_view', function() {

  beforeEach(function() {
    this.user = new cdb.admin.User({
      id: 'user-id',
      username: 'pepe',
      actions: {},
      organization: {
        id: 'org-id',
        users: [{
          id: 'ou-1',
          username: 'paco'
        },
        {
          id: 'ou-2',
          username: 'pepe'
        }]
      }
    });

    this.group = new cdb.admin.Group({
      id: 'g1',
      organization: this.user.organization,
      users: [{
        id: 'gu-1',
        username: 'pachi'
      }]
    });

    this.groupUsers = this.group.users;
    spyOn(this.groupUsers, 'addInBatch')

    this.orgUsers = this.user.organization.users;

    this.view = new EmptyGroupFiltersExtraView({
      groupUsers: this.groupUsers,
      orgUsers: this.orgUsers
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should show the add-users button disabled', function() {
    expect(this.view.$('.js-add-users').hasClass('is-disabled')).toBe(true);
  });

  it('should do nothing on click add-button', function() {
    this.view.$('.js-add-users').click();
    expect(this.groupUsers.addInBatch).not.toHaveBeenCalled();
  });

  describe('when at least one user is selected', function() {
    beforeEach(function() {
      this.orgUsers.first().set('selected', true);
    });

    it('should change the subheader to show add button', function() {
      expect(this.view.$('.js-add-users').hasClass('is-disabled')).toBe(false);
    });

    describe('when click add', function() {
      beforeEach(function() {
        jasmine.clock().install(); // due to modal animations
        this.jqXHR = $.Deferred();
        this.groupUsers.addInBatch.and.returnValue(this.jqXHR);
        this.view.$('.js-add-users').click();
        jasmine.clock().tick(1000);
      });

      afterEach(function() {
        jasmine.clock().uninstall();
      });

      it('should call group users collection to add them in batch', function() {
        expect(this.group.users.addInBatch).toHaveBeenCalled();
        expect(this.group.users.addInBatch).toHaveBeenCalledWith(jasmine.any(Array));
        expect(this.group.users.addInBatch).toHaveBeenCalledWith(['ou-1']);
      });

      it('should show removing users loader in a modal', function() {
        expect($('.Dialog').text()).toContain('Adding');
      });

      describe('when users are added', function() {
        beforeEach(function() {
          this.jqXHR.resolve();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function() {
          expect($('.Dialog').length).toEqual(0);
        });
      });

      describe('when fails to add users', function() {
        beforeEach(function() {
          this.jqXHR.reject();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function() {
          expect($('.Dialog').text()).not.toContain('Adding');
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
