var $ = require('jquery');
var cdb = require('cartodb.js');
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
    spyOn(this.permission, 'setPermission').and.callThrough();
    spyOn(this.permission, 'removePermission').and.callThrough();

    this.detailsView = new cdb.core.View();
    this.detailsView.render = function() {
      this.$el.html('**details**');
      return this;
    }

    this.view = new PermissionView({
      model: this.model,
      permission: this.permission,
      detailsView: this.detailsView,
      showWriteAccessToggleAccess: false
    });
    this.view.render();
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when can change write access', function() {
    beforeEach(function() {
      this.view.options.showWriteAccessToggleAccess = true;
      this.view.render();
    });

    it('should not disable any toggler', function() {
      expect(this.innerHTML()).toContain('js-write');
      expect(this.innerHTML()).toContain('js-read');
      expect(this.innerHTML()).not.toContain('disabled');
    });

    describe('when click write toggle', function() {
      beforeEach(function() {
        this.view.$('.js-write').change();
        this.view.$('.js-write').change();
        this.view.$('.js-write').change();
      });

      it('should be able to toggle write access', function() {
        expect(this.permission.setPermission).toHaveBeenCalled();
      });

      it('should toggle write access for each click', function() {
        expect(this.permission.setPermission.calls.argsFor(0)).toEqual([ this.model, cdb.admin.Permission.READ_WRITE ]);
        expect(this.permission.setPermission.calls.argsFor(1)).toEqual([ this.model, cdb.admin.Permission.READ_ONLY ]);
        expect(this.permission.setPermission.calls.argsFor(2)).toEqual([ this.model, cdb.admin.Permission.READ_WRITE ]);
      });
    });
  });

  describe('when cannot change write access', function() {
    beforeEach(function() {
      this.view.options.showWriteAccessToggleAccess = false;
      this.view.render();
    });

    it('should not render write toggler', function() {
      expect(this.innerHTML()).not.toContain('js-write');
      this.view.$('.js-write').click();
      expect(this.permission.setPermission).not.toHaveBeenCalled();
    });
  });

  describe('when click read toggle', function() {
    beforeEach(function() {
      this.view.$('.js-read').change();
      this.view.$('.js-read').change();
      this.view.$('.js-read').change();
    });

    it('should toggle read access', function() {
      expect(this.permission.setPermission.calls.argsFor(0)).toEqual([ this.model, cdb.admin.Permission.READ_ONLY ]);
      expect(this.permission.removePermission.calls.argsFor(0)).toEqual([ this.model ]);
      expect(this.permission.setPermission.calls.argsFor(1)).toEqual([ this.model, cdb.admin.Permission.READ_ONLY ]);
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
