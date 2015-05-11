var PermissionView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/permission_view');
var cdbAdmin = require('cdb.admin');

describe('common/dialogs/change_privacy/share/permission_view', function() {
  beforeEach(function() {
    this.model = new cdbAdmin.User({
      id: 'abc-123',
      username: 'pepe',
      name: 'Pepe paco',
      avatar_url: 'http://host.ext/path/img.jpg'
    });

    this.permission = new cdbAdmin.Permission({});
    spyOn(this.permission, 'setPermission').and.callThrough();
    spyOn(this.permission, 'removePermission').and.callThrough();

    this.title = this.model.get('username');
    this.desc = this.model.get('name');
    this.avatarUrl = this.model.get('avatar_url');
    this.canChangeWriteAccess = true;

    this.createView = function() {
      this.view && this.view.clean();
      this.view = new PermissionView({
        model: this.model,
        permission: this.permission,
        title: this.title,
        desc: this.desc,
        avatarUrl: this.avatarUrl,
        canChangeWriteAccess: this.canChangeWriteAccess
      });
      $(document.body).append(this.view.$el);
      return this.view.render();
    };
  });

  describe('given default case', function() {
    beforeEach(function() {
      this.createView();
    });

    it('should not have any leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render the title', function() {
      expect(this.innerHTML()).toContain(this.title);
    });

    it('should render the desc', function() {
      expect(this.innerHTML()).toContain(this.desc);
    });

    describe('given has a avatar url', function() {
      it('should render the avatar', function() {
        expect(this.innerHTML()).toContain(this.avatarUrl);
        expect(this.innerHTML()).not.toContain('iconFont-People');
      });
    });
  });

  describe('given has no avatar url', function() {
    beforeEach(function() {
      this.avatarUrl = undefined;
      this.createView();
    });

    it('should render the default people icon', function() {
      expect(this.innerHTML()).toContain('iconFont-People');
    });
  });

  describe('given can change write access', function() {
    beforeEach(function() {
      this.createView();
    });

    it('should not disable any toggler', function() {
      expect(this.innerHTML()).toContain('js-write');
      expect(this.innerHTML()).toContain('js-read');
      expect(this.innerHTML()).not.toContain('disabled');
    });

    describe('and on click .js-write', function() {
      it('should be able to toggle write access', function() {
        this.view.$('.js-write').click();
        expect(this.permission.setPermission).toHaveBeenCalled();
      });

      it('should toggle write access', function() {
        this.view.$('.js-write').click();
        this.view.$('.js-write').click();
        this.view.$('.js-write').click();

        expect(this.permission.setPermission.calls.argsFor(0)).toEqual([ this.model, cdbAdmin.Permission.READ_WRITE ]);
        expect(this.permission.setPermission.calls.argsFor(1)).toEqual([ this.model, cdbAdmin.Permission.READ_ONLY ]);
        expect(this.permission.setPermission.calls.argsFor(2)).toEqual([ this.model, cdbAdmin.Permission.READ_WRITE ]);
      });
    });
  });

  describe('given cannot change write access', function() {
    beforeEach(function() {
      this.canChangeWriteAccess = false;
      this.createView();
    });

    it('should not render write toggler', function() {
      expect(this.innerHTML()).not.toContain('js-write');
      this.view.$('.js-write').click();
      expect(this.permission.setPermission).not.toHaveBeenCalled();
    });
  });

  describe('on click .js-read', function() {
    beforeEach(function() {
      this.createView();
    });

    it('should toggle read access', function() {
      this.view.$('.js-read').click();
      this.view.$('.js-read').click();
      this.view.$('.js-read').click();

      expect(this.permission.setPermission.calls.argsFor(0)).toEqual([ this.model, cdbAdmin.Permission.READ_ONLY ]);
      expect(this.permission.removePermission.calls.argsFor(0)).toEqual([ this.model ]);
      expect(this.permission.setPermission.calls.argsFor(1)).toEqual([ this.model, cdbAdmin.Permission.READ_ONLY ]);
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
