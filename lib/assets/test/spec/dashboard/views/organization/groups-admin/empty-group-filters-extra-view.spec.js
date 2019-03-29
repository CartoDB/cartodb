const $ = require('jquery');
const EmptyGroupFiltersExtraView = require('dashboard/views/organization/groups-admin/filters/empty-group-filters-extra-view');
const UserModel = require('dashboard/data/user-model');
const GroupModel = require('dashboard/data/group-model');
const OrganizationModel = require('dashboard/data/organization-model');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const configModel = require('fixtures/dashboard/config-model.fixture');

const PASSWORD = 'password';

describe('organization/groups_admin/empty_group_filters_extra_view', function () {
  beforeEach(function () {
    spyOn(PasswordValidatedForm, 'showPasswordModal').and.callFake(
      function (options) {
        options.onPasswordTyped && options.onPasswordTyped(PASSWORD);
      }
    );

    this.organization = new OrganizationModel({
      id: 'org-id',
      users: [{
        id: 'ou-1',
        username: 'paco'
      },
      {
        id: 'ou-2',
        username: 'pepe'
      }]
    }, { configModel });

    this.user = new UserModel({
      id: 'user-id',
      username: 'pepe',
      actions: {},
      needs_password_confirmation: true
    });
    this.user.setOrganization(this.organization);

    this.group = new GroupModel({
      id: 'g1',
      organization: this.user.organization,
      users: [{
        id: 'gu-1',
        username: 'pachi'
      }]
    }, { configModel });

    this.groupUsers = this.group.users;
    spyOn(this.groupUsers, 'addInBatch');

    this.orgUsers = this.user.organization.users;

    this.view = new EmptyGroupFiltersExtraView({
      groupUsers: this.groupUsers,
      orgUsers: this.orgUsers,
      userModel: this.user
    });
    this.view.render();
  });

  afterEach(function () {
    // The Dialog closing action occurs within a 120ms delay, so we
    // remove it manually instead of waiting for the dialog to close
    var dialog = document.querySelector('.Dialog');

    if (dialog) {
      dialog.remove();
    }
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should show the add-users button disabled', function () {
    expect(this.view.$('.js-add-users').hasClass('is-disabled')).toBe(true);
  });

  it('should do nothing on click add-button', function () {
    this.view.$('.js-add-users').click();
    expect(this.groupUsers.addInBatch).not.toHaveBeenCalled();
  });

  describe('when at least one user is selected', function () {
    beforeEach(function () {
      this.orgUsers.first().set('selected', true);
    });

    it('should change the subheader to show add button', function () {
      expect(this.view.$('.js-add-users').hasClass('is-disabled')).toBe(false);
    });

    describe('when click add', function () {
      beforeEach(function () {
        jasmine.clock().install(); // due to modal animations
        this.jqXHR = $.Deferred();
        this.groupUsers.addInBatch.and.returnValue(this.jqXHR);
        this.view.$('.js-add-users').click();
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

        this.view = new EmptyGroupFiltersExtraView({
          groupUsers: this.groupUsers,
          orgUsers: this.orgUsers,
          userModel
        });

        expect(PasswordValidatedForm.showPasswordModal).not.toHaveBeenCalled();
      });

      it('should call group users collection to add them in batch', function () {
        expect(this.group.users.addInBatch).toHaveBeenCalled();
        expect(this.group.users.addInBatch).toHaveBeenCalledWith(jasmine.any(Array), jasmine.any(String));
        expect(this.group.users.addInBatch).toHaveBeenCalledWith(['ou-1'], PASSWORD);
      });

      it('should show removing users loader in a modal', function () {
        expect($('.Dialog').text()).toContain('Adding');
      });

      describe('when users are added', function () {
        beforeEach(function () {
          this.jqXHR.resolve();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function () {
          expect($('.Dialog').length).toEqual(0);
        });
      });

      describe('when fails to add users', function () {
        beforeEach(function () {
          this.jqXHR.reject();
          jasmine.clock().tick(1000);
        });

        it('should close loading modal', function () {
          expect($('.Dialog').text()).not.toContain('Adding');
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
