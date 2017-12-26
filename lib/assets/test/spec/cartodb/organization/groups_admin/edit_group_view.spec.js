var cdb = require('cartodb.js-v3');
var FlashMessageModel = require('../../../../../javascripts/cartodb/organization/flash_message_model');
var EditGroupView = require('../../../../../javascripts/cartodb/organization/groups_admin/edit_group_view');

describe('organization/groups_admin/edit_group_view', function () {
  beforeEach(function () {
    this.group = new cdb.admin.Group({
      id: 'g1',
      display_name: 'my group'
    });
    spyOn(this.group, 'save');

    this.onSavedSpy = jasmine.createSpy('onSaved callback');
    this.onDeletedSpy = jasmine.createSpy('onDeleted callback');

    this.flashMessageModel = new FlashMessageModel();

    this.view = new EditGroupView({
      flashMessageModel: this.flashMessageModel,
      group: this.group,
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
          expect(this.flashMessageModel.show).toHaveBeenCalledWith('ERR!');
        });
      });
    });
  });

  describe('when click delete group', function () {
    beforeEach(function () {
      spyOn(this.group, 'destroy');
      this.view.$('.js-delete').click();
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
