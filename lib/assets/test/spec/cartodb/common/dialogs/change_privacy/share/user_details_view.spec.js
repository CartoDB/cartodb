var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var UserDetailsView = require('../../../../../../../javascripts/cartodb/common/dialogs/change_privacy/share/user_details_view');

describe('common/dialogs/change_privacy/share/user_details_view', function() {
  beforeEach(function() {
    this.model = new cdb.admin.User({
      id: 'abc-123',
      username: 'pepe',
      name: 'Pepe',
      email: 'pepe@carto.com',
      avatar_url: 'http://host.ext/path/img.jpg'
    });

    this.permission = new cdb.admin.Permission({});

    this.view = new UserDetailsView({
      model: this.model,
      permission: this.permission,
      isUsingVis: true
    });
    return this.view.render();
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the title', function() {
    expect(this.innerHTML()).toContain('pepe');
  });

  it('should render the desc', function() {
    expect(this.innerHTML()).toContain('pepe@carto.com');
  });

  it('should render the avatar', function() {
    expect(this.innerHTML()).toContain('img.jpg');
    expect(this.innerHTML()).not.toContain('CDB-IconFont-people');
  });

  describe('given has no avatar url', function() {
    beforeEach(function() {
      this.model.unset('avatar_url')
      this.view.render();
    });

    it('should render the default people icon', function() {
      expect(this.innerHTML()).toContain('CDB-IconFont-people');
    });
  });

  describe('when is using vis', function() {
    beforeEach(function() {
      this.view.options.isUsingVis = true;
    });

    describe('when user can still access item', function() {
      beforeEach(function() {
        spyOn(this.permission, 'hasReadAccess').and.returnValue(true);
        this.view.render();
        expect(this.permission.hasReadAccess).toHaveBeenCalledWith(this.model);
      });

      it('should render the info text about usage', function() {
        expect(this.innerHTML()).toContain('using');
      });
    });

    describe('when user is getting access revoked', function() {
      beforeEach(function() {
        spyOn(this.permission, 'hasReadAccess').and.returnValue(false);
        this.view.render();
        expect(this.permission.hasReadAccess).toHaveBeenCalledWith(this.model);
      });

      it('should warn about destructive change', function() {
        expect(this.innerHTML()).toContain('will be affected');
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
