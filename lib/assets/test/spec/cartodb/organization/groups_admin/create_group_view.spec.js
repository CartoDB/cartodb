var cdb = require('cartodb.js-v3');
var FlashMessageModel = require('../../../../../javascripts/cartodb/organization/flash_message_model');
var CreateGroupView = require('../../../../../javascripts/cartodb/organization/groups_admin/create_group_view');

describe('organization/groups_admin/create_group_view', function () {
  beforeEach(function () {
    this.group = new cdb.admin.Group();
    spyOn(this.group, 'save');
    this.onCreatedSpy = jasmine.createSpy('onCreated callback');
    this.flashMessageModel = new FlashMessageModel();
    this.view = new CreateGroupView({
      flashMessageModel: this.flashMessageModel,
      group: this.group,
      onCreated: this.onCreatedSpy
    });
    this.view.render();
  });

  it('should render input', function () {
    expect(this.view.$('input').length > 0).toBe(true);
  });

  describe('when click create group', function () {
    it('should not try to save group if has no name', function () {
      this.view.$('.js-create').click();
      expect(this.group.save).not.toHaveBeenCalled();
    });

    describe('when has written a name', function () {
      beforeEach(function () {
        this.view.$('.js-name').val('foobar');
        this.view.$('.js-create').click();
      });

      it('should try to create group', function () {
        expect(this.group.save).toHaveBeenCalled();
      });

      it('should show loading meanwhile', function () {
        expect(this.innerHTML()).toContain('Creating group');
      });

      it('should not add to collection until got response', function () {
        expect(this.group.save.calls.argsFor(0)[1].wait).toBe(true);
      });

      describe('when create succeeds', function () {
        beforeEach(function () {
          this.group.save.calls.argsFor(0)[1].success();
        });

        it('should call onCreated callback', function () {
          expect(this.onCreatedSpy).toHaveBeenCalled();
        });
      });

      describe('when create fails', function () {
        beforeEach(function () {
          spyOn(this.flashMessageModel, 'show');
          this.group.save.calls.argsFor(0)[1].error(this.group, {responseText: '{"errors": ["ERR!"]}'});
        });

        it('should show form again', function () {
          expect(this.innerHTML()).not.toContain('Creating group');
        });

        it('should show error', function () {
          expect(this.flashMessageModel.show).toHaveBeenCalledWith('ERR!');
        });
      });
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
