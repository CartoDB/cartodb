var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var PermissionView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/permission_view');

describe('common/dialogs/change_privacy/share/permission_view', function() {
  beforeEach(function() {
    this.model = new cdb.admin.User({
      id: 'abc-123',
      username: 'pepe',
      name: 'Pepe paco',
      avatar_url: 'http://host.ext/path/img.jpg'
    });

    this.permission = new cdb.admin.Permission({});
    spyOn(this.permission, 'canChangeReadAccess').and.callThrough();
    spyOn(this.permission, 'canChangeWriteAccess').and.callThrough();
    spyOn(this.permission, 'hasReadAccess').and.callThrough();
    spyOn(this.permission, 'hasWriteAccess').and.callThrough();
    spyOn(this.permission, 'revokeAccess').and.callThrough();
    spyOn(this.permission, 'revokeWriteAccess').and.callThrough();
    spyOn(this.permission, 'grantReadAccess').and.callThrough();
    spyOn(this.permission, 'grantWriteAccess').and.callThrough();

    this.detailsView = new cdb.core.View();
    this.detailsView.render = function() {
      this.$el.html('**details**');
      return this;
    }

    this.view = new PermissionView({
      model: this.model,
      permission: this.permission,
      detailsView: this.detailsView,
      isWriteAccessTogglerAvailable: false
    });
    this.view.render();
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when can change write access', function() {
    beforeEach(function() {
      this.view.options.isWriteAccessTogglerAvailable = true;
      this.view.render();
    });

    it('should not disable any toggler', function() {
      expect(this.innerHTML()).not.toContain('disabled');
    });

    describe('when click write toggle', function() {
      beforeEach(function() {
        this.clickWriteToggler = function() {
          this.view.$('.js-input:first').change();
        };
      });

      describe('when can not change write access', function() {
        beforeEach(function() {
          this.permission.canChangeWriteAccess.and.returnValue(false);
          this.clickWriteToggler();
        });

        it('should check if can change state', function() {
          expect(this.permission.canChangeWriteAccess).toHaveBeenCalled();
          expect(this.permission.canChangeWriteAccess).toHaveBeenCalledWith(this.model);
        });

        it('should not change any state though', function() {
          expect(this.permission.revokeWriteAccess).not.toHaveBeenCalled();
          expect(this.permission.grantWriteAccess).not.toHaveBeenCalled();
        });
      });

      describe('when can change write access', function() {
        beforeEach(function() {
          this.permission.canChangeWriteAccess.and.returnValue(true);
          this.clickWriteToggler();
        });

        it('should alternative between granting or revoking access for each click', function() {
          // Grant
          expect(this.permission.grantWriteAccess).toHaveBeenCalled();
          expect(this.permission.grantWriteAccess).toHaveBeenCalledWith(this.model);

          // Revoke
          this.clickWriteToggler();
          expect(this.permission.revokeWriteAccess).toHaveBeenCalled()
          expect(this.permission.revokeWriteAccess).toHaveBeenCalledWith(this.model)
          expect(this.permission.revokeWriteAccess.calls.count()).toEqual(1);

          // Grant again
          this.clickWriteToggler();
          expect(this.permission.grantWriteAccess.calls.count()).toEqual(2);
          expect(this.permission.revokeWriteAccess.calls.count()).toEqual(1);
        });
      });
    });
  });

  describe('when write toggler is unavailable', function() {
    beforeEach(function() {
      this.view.options.isWriteAccessTogglerAvailable = false;
      this.view.render();
    });

    it('should not render write toggler', function() {
      expect(this.innerHTML()).not.toContain('Write');
      expect(this.view.$('.js-input').length).toEqual(1);
    });
  });

  describe('when can change read access', function() {
    it('should not disable any toggler', function() {
      expect(this.innerHTML()).not.toContain('disabled');
    });

    describe('when click write toggle', function() {
      beforeEach(function() {
        this.clickReadToggler = function() {
          this.view.$('.js-input:last').change();
        };
      });

      describe('when can not change read access', function() {
        beforeEach(function() {
          this.permission.canChangeReadAccess.and.returnValue(false);
          this.clickReadToggler();
        });

        it('should check if can change state', function() {
          expect(this.permission.canChangeReadAccess).toHaveBeenCalled();
          expect(this.permission.canChangeReadAccess).toHaveBeenCalledWith(this.model);
        });

        it('should not change any state though', function() {
          expect(this.permission.revokeAccess).not.toHaveBeenCalled();
          expect(this.permission.grantReadAccess).not.toHaveBeenCalled();
        });
      });

      describe('when can change read access', function() {
        beforeEach(function() {
          this.permission.canChangeReadAccess.and.returnValue(true);
          this.clickReadToggler();
        });

        it('should alternative between granting or revoking access for each click', function() {
          // Grant
          expect(this.permission.grantReadAccess).toHaveBeenCalled();
          expect(this.permission.grantReadAccess).toHaveBeenCalledWith(this.model);

          // Revoke
          this.clickReadToggler();
          expect(this.permission.revokeAccess).toHaveBeenCalled()
          expect(this.permission.revokeAccess).toHaveBeenCalledWith(this.model)
          expect(this.permission.revokeAccess.calls.count()).toEqual(1);

          // Grant again
          this.clickReadToggler();
          expect(this.permission.grantReadAccess.calls.count()).toEqual(2);
          expect(this.permission.revokeAccess.calls.count()).toEqual(1);
        });
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
