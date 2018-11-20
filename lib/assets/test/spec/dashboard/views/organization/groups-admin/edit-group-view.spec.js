const FlashMessageModel = require('dashboard/data/flash-message-model');
const GroupModel = require('dashboard/data/group-model');
const PasswordValidatedForm = require('dashboard/helpers/password-validated-form');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const EditGroupView = require('dashboard/views/organization/groups-admin/edit-group/edit-group-view');

const configModel = require('fixtures/dashboard/config-model.fixture');
const UserModel = require('fixtures/dashboard/user-model.fixture');

describe('organization/groups-admin/edit-group-view', function () {
  beforeEach(function () {
    this.group = new GroupModel({
      id: 'g1',
      display_name: 'my group'
    }, { configModel });
    spyOn(this.group, 'save');

    spyOn(PasswordValidatedForm, 'showPasswordModal').and.callFake(
      function (options) {
        options.onPasswordTyped && options.onPasswordTyped();
      }
    );

    this.onSavedSpy = jasmine.createSpy('onSaved callback');
    this.onDeletedSpy = jasmine.createSpy('onDeleted callback');

    this.flashMessageModel = new FlashMessageModel();

    this.view = new EditGroupView({
      flashMessageModel: this.flashMessageModel,
      group: this.group,
      userModel: new UserModel(),
      modals: new ModalsServiceModel(),
      onSaved: this.onSavedSpy,
      onDeleted: this.onDeletedSpy
    });
    this.view.render();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when click save', function () {
    it('should not try to save group if has no name', function () {
      this.view.$('.js-name').val('');
      this.view.$('.js-save').click();
      expect(this.group.save).not.toHaveBeenCalled();
    });

    describe('when has changed name', function () {
      beforeEach(function () {
        this.view.$('.js-name').val('new name');
        this.view.$('.js-save').click();
      });

      it('should try to save group', function () {
        expect(this.group.save).toHaveBeenCalled();
        expect(this.group.save).toHaveBeenCalledWith({
          display_name: 'new name'
        }, jasmine.any(Object));
      });

      it('should show loading meanwhile', function () {
        expect(this.innerHTML()).toContain('Saving');
      });

      it('should not update model until got response back', function () {
        expect(this.group.save.calls.argsFor(0)[1].wait).toBe(true);
      });

      describe('when save succeeds', function () {
        beforeEach(function () {
          this.group.set({
            id: 'g1'
          });
          this.group.save.calls.argsFor(0)[1].success();
        });

        it('should call onSaved callback', function () {
          expect(this.onSavedSpy).toHaveBeenCalled();
        });
      });

      describe('when save fails', function () {
        beforeEach(function () {
          spyOn(this.flashMessageModel, 'show');
          this.group.save.calls.argsFor(0)[1].error(this.group, {responseText: '{"errors": ["ERR!"]}'});
        });

        it('should show form again', function () {
          expect(this.view.$('input').length > 0).toBe(true);
        });

        it('should show error', function () {
          expect(this.flashMessageModel.show).toHaveBeenCalledWith('ERR!', 'error');
        });
      });
    });
  });

  describe('when click delete group', function () {
    beforeEach(function () {
      spyOn(this.group, 'destroy');
      this.view.$('.js-delete').click();
    });

    it('should require password confirmation if needed', function () {
      expect(PasswordValidatedForm.showPasswordModal).toHaveBeenCalled();
    });

    it('should bypass password confirmation when needs_password_validation is false', function () {
      PasswordValidatedForm.showPasswordModal.calls.reset();

      this.view = new EditGroupView({
        flashMessageModel: this.flashMessageModel,
        group: this.group,
        userModel: new UserModel({ needs_password_validation: false }),
        modals: new ModalsServiceModel(),
        onSaved: this.onSavedSpy,
        onDeleted: this.onDeletedSpy
      });

      expect(PasswordValidatedForm.showPasswordModal).not.toHaveBeenCalled();
    });

    it('should change to loading while destroying', function () {
      expect(this.innerHTML()).toContain('Deleting');
    });

    it('should not remove from collection until response confirms it deleteted', function () {
      expect(this.group.destroy.calls.argsFor(0)[0].wait).toBe(true);
    });

    describe('when deleted', function () {
      beforeEach(function () {
        this.group.destroy.calls.argsFor(0)[0].success();
      });

      it('should call onDeleted callback', function () {
        expect(this.onDeletedSpy).toHaveBeenCalled();
      });
    });

    describe('when deletion fails', function () {
      beforeEach(function () {
        this.group.destroy.calls.argsFor(0)[0].error();
      });

      it('should show form again', function () {
        expect(this.view.$('input').length > 0).toBe(true);
      });
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
