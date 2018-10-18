const $ = require('jquery');
const AddOrRemoveGroupUsersFiltersExtraView = require('dashboard/views/organization/groups-admin/filters/add-or-remove-group-users-filters-extra-view');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const AddGroupUsersView = require('dashboard/views/organization/groups-admin/add-group-users/add-group-users-view');

const configModel = require('fixtures/dashboard/config-model.fixture');
const UserModel = require('dashboard/data/user-model');
const GroupModel = require('dashboard/data/group-model');
const OrganizationModel = require('dashboard/data/organization-model');

const PASSWORD = 'password';

describe('organization/groups-admin/add-or-remove-group-users-filters-extra-view', function () {
  beforeEach(function () {
    spyOn(PasswordValidatedForm, 'showPasswordModal').and.callFake(
      function (options) {
        options.onPasswordTyped && options.onPasswordTyped(PASSWORD);
      }
    );

    this.user = new UserModel({
      id: 'user-id',
      username: 'pepe',
      actions: {},
      needs_password_confirmation: true
    }, {});

    this.organization = new OrganizationModel({
      id: 'org-id',
      users: [{
        id: 'abc-123',
        username: 'paco'
      },
      {
        id: 'abc-456',
        username: 'pepe'
      }]
    }, { configModel });

    this.user.setOrganization(this.organization);

    this.group = new GroupModel({
      id: 'g1',
      organization: this.user.organization,
      users: [{
        id: 'u1',
        username: 'pachi'
      }]
    }, { configModel });

    spyOn(AddGroupUsersView.prototype, 'initialize').and.callThrough();

    this.view = new AddOrRemoveGroupUsersFiltersExtraView({
      group: this.group,
      orgUsers: this.user.organization.users,
      userModel: this.user
    });
    this.view.render();
  });

  afterEach(function () {
    // The Dialog closing action occurs within a 120ms delay, so we
    // remove it manually instead of waiting for the dialog to close
    const dialog = document.querySelector('.Dialog');

    if (dialog) {
      dialog.remove();
    }
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should not open dialog to add users just yet', function () {
    expect(AddGroupUsersView.prototype.initialize).not.toHaveBeenCalled();
  });

  it('should show the add users button', function () {
    expect(this.view.$('.js-add-users').attr('style')).toBeUndefined();
    expect(this.view.$('.js-rm-users').attr('style')).toContain('display: none');
  });

  describe('when click add', function () {
    beforeEach(function () {
      this.view.$('.js-add-users').click();
    });

    it('should open dialog to add users', function () {
      expect(AddGroupUsersView.prototype.initialize).toHaveBeenCalled();
    });
  });

  describe('when at least one user is selected', function () {
    beforeEach(function () {
      this.group.users.first().set('selected', true);
    });

    it('should change the subheader to show remove button', function () {
      expect(this.view.$('.js-add-users').attr('style')).toContain('display: none');
      expect(this.view.$('.js-rm-users').attr('style')).not.toContain('none');
    });

    describe('when click remove', function () {
      beforeEach(function () {
        jasmine.clock().install(); // due to modal animations
        this.jqXHR = $.Deferred();
        spyOn(this.group.users, 'removeInBatch').and.returnValue(this.jqXHR);
        this.view.$('.js-rm-users').click();
        jasmine.clock().tick(1000);
      });

      afterEach(function () {
        jasmine.clock().uninstall();
      });

      it('should require password confirmation if needed', function () {
        expect(PasswordValidatedForm.showPasswordModal).toHaveBeenCalled();
      });

      it('should bypass password confirmation when needs_password_validation is false', function () {
        PasswordValidatedForm.showPasswordModal.calls.reset();

        const userModel = new UserModel({
          needs_password_confirmation: false
        });

        this.view = new AddOrRemoveGroupUsersFiltersExtraView({
          group: this.group,
          orgUsers: this.user.organization.users,
          userModel
        });

        expect(PasswordValidatedForm.showPasswordModal).not.toHaveBeenCalled();
      });

      it('should call group users collection to remove them in batch', function () {
        expect(this.group.users.removeInBatch).toHaveBeenCalled();
        expect(this.group.users.removeInBatch).toHaveBeenCalledWith(jasmine.any(Array), jasmine.any(String));
        expect(this.group.users.removeInBatch).toHaveBeenCalledWith(['u1'], PASSWORD);
      });

      it('should show removing users loader in a modal', function () {
        expect($('.Dialog').text()).toContain('Removing users');
      });

      describe('when users are removed', function () {
        beforeEach(function () {
          this.jqXHR.resolve();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function () {
          expect($('.Dialog').length).toEqual(0);
        });
      });

      describe('when fails to remove users', function () {
        beforeEach(function () {
          this.jqXHR.reject();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function () {
          expect($('.Dialog').text()).not.toContain('Removing users');
        });

        it('should show error modal', function () {
          expect($('.Dialog').text()).toContain('error');
        });
      });
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
