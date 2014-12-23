var MapItem = require('new_dashboard/maps/maps_item');
var Router = require('new_dashboard/router');

describe('new_dashboard/maps/maps_item', function() {
  beforeEach(function() {

    this.vis = new cdb.admin.Visualization({
      id: '8988-8888-8888',
      name: 'map_title',
      privacy: 'PUBLIC',
      type: 'derived',
      updated_at: (new Date()).toISOString(),
      likes: 2
    });

    spyOn(this.vis, 'on');

    this.user = new cdb.admin.User({});

    this.router = new Router({
      rootUrl: ''
    });
    this.router.model.set('content_type', 'maps');

    this.view = new MapItem({
      model: this.vis,
      user: this.user,
      router: this.router
    });


    this.html = 'call this.renderView(); in your test case!';
    this.renderView = function() {
      this.view.render();
      this.html = this.view.el.innerHTML;
    };
  });

  it('should render if map model changes', function() {
    expect(this.vis.on).toHaveBeenCalledWith('change', this.view.render, this.view);
  });

  it('should render the title', function() {
    this.renderView();
    expect(this.html).toContain('map_title');
  });

  describe('render the URL to map', function() {

    it('should be the standard one when user doesn\'t belong to an org', function() {
      this.renderView();
      expect($(this.html).find('.DefaultTitle-link').attr('href')).toContain('/viz/8988-8888-8888/map');
    });

    it('should be to the owner (the same user) one when user belongs to an org', function() {
      this.vis.permission = new cdb.admin.Permission();
      
      userMock = sinon.mock(this.user);
      userMock.expects('isInsideOrg').returns(true);
      
      permissionMock = sinon.mock(this.vis.permission);
      permissionMock.expects('isOwner').withArgs(this.user).returns(true);
      permissionMock.expects('getPermission').withArgs(this.user).returns('w');
      
      ownerMock = sinon.mock(this.vis.permission.owner);
      ownerMock.expects('get').withArgs('username').returns('paco');
      ownerMock.expects('renderData').withArgs(this.user).returns(this.user.toJSON());

      this.renderView();

      expect(this.html).toContain('/u/paco/viz/8988-8888-8888/map');
    });

    it('should be to the owner (not the user) one when user belongs to an org', function() {
      this.vis.permission = new cdb.admin.Permission();
      var u1 = new cdb.admin.User({ username: 'whoknows' });
      
      userMock = sinon.mock(this.user);
      userMock.expects('isInsideOrg').returns(true);
      
      permissionMock = sinon.mock(this.vis.permission);
      permissionMock.expects('isOwner').withArgs(this.user).returns(false);
      permissionMock.expects('getPermission').withArgs(this.user).returns('r');
      
      ownerMock = sinon.mock(this.vis.permission.owner);
      ownerMock.expects('get').withArgs('username').returns('whoknows');
      ownerMock.expects('renderData').withArgs(this.user).returns(u1.toJSON());

      this.renderView();

      expect(this.html).toContain('/u/whoknows/viz/8988-8888-8888/map');
    });
    
  });

  it('should render likes count', function() {
    this.renderView();
    expect($(this.html).find('.LikesIndicator').length).toBe(1);
    expect($(this.html).find('.LikesIndicator').text()).toBe('2');
  });

  it('should render privacy', function() {
    this.renderView();
    expect($(this.html).find('.PrivacyIndicator').length).toBe(1);
    expect($(this.html).find('.PrivacyIndicator').text()).toBe('public');
    expect($(this.html).find('.PrivacyIndicator').hasClass('is-public')).toBeTruthy();
  });

  describe('render owner user info', function() {

    it('shouldn\'t render owner info if user is not in a org', function() {
      this.renderView();
      expect($(this.html).find('.UserAvatar').length).toBe(0);
    });

    it('shouldn\'t render owner info if user is the owner of the map', function() {
      this.vis.permission = new cdb.admin.Permission();
      
      userMock = sinon.mock(this.user);
      userMock.expects('isInsideOrg').returns(true);
      
      permissionMock = sinon.mock(this.vis.permission);
      permissionMock.expects('isOwner').withArgs(this.user).returns(true);
      permissionMock.expects('getPermission').withArgs(this.user).returns('w');
      
      ownerMock = sinon.mock(this.vis.permission.owner);
      ownerMock.expects('get').withArgs('username').returns('paco');
      ownerMock.expects('renderData').withArgs(this.user).returns(this.user.toJSON());

      this.renderView();
      expect($(this.html).find('.UserAvatar').length).toBe(0);
    });

    it('should render owner info if user is not the owner of the map', function() {
      this.vis.permission = new cdb.admin.Permission();
      var u1 = new cdb.admin.User({ username: 'whoknows' });
      
      userMock = sinon.mock(this.user);
      userMock.expects('isInsideOrg').returns(true);
      
      permissionMock = sinon.mock(this.vis.permission);
      permissionMock.expects('isOwner').withArgs(this.user).returns(false);
      permissionMock.expects('getPermission').withArgs(this.user).returns('r');
      
      ownerMock = sinon.mock(this.vis.permission.owner);
      ownerMock.expects('get').withArgs('username').returns('whoknows');
      ownerMock.expects('renderData').withArgs(this.user).returns(u1.toJSON());

      this.renderView();
      expect($(this.html).find('.UserAvatar').length).toBe(1);
      expect($(this.html).find('.UserAvatar img').attr('title')).toBe('whoknows');
    });
    
  });

  it('should render timediff', function() {
    this.renderView();
    expect($(this.html).find('.MapCard-contentFooterTimeDiff').length).toBe(1);
    expect($(this.html).find('.MapCard-contentFooterTimeDiff').text()).toContain('a few seconds ago');
  });

  it('should render mapviews graph', function() {
    this.renderView();
    expect($(this.html).find('.MapCard-headerGraph').length).toBe(1);
    expect($(this.html).find('.MapCard-headerGraph svg').length).toBe(1);
  });

  describe('description', function() {
    it('should show description if it is set', function() {
      this.vis.set('description', 'my desc');
      this.renderView();
      expect($(this.html).find('.DefaultDescription').length).toBe(1);
      expect($(this.html).find('.DefaultDescription').text()).toBe('my desc');
    });

    it("should show 'add description...' if it is not set", function() {
      this.renderView();
      expect($(this.html).find('.DefaultDescription').length).toBe(0);
      expect($(this.html).find('.MapCard-contentDescription .DefaultEditInline-form').length).toBe(1);
      expect($(this.html).find('.MapCard-contentDescription .DefaultEditInline-input').attr('placeholder')).toContain('Add a description...');
      expect($(this.html).find('.MapCard-contentDescription .DefaultEditInline-input').val()).toBe('');
    });
  });

  describe('tags', function() {
    it('should show tags if it is set', function() {
      this.vis.set('tags', ['my','tags','mamma','oh']);
      this.renderView();
      expect($(this.html).find('.DefaultTags-item').length).toBe(3);
      expect($(this.html).find('.MapCard-contentTags').text()).toContain('and 1 more');
    });

    it("should show 'add description...' if it is not set", function() {
      this.renderView();
      expect($(this.html).find('.DefaultTags-item').length).toBe(0);
      expect($(this.html).find('.MapCard-contentTags .DefaultEditInline-form').length).toBe(1);
      expect($(this.html).find('.MapCard-contentTags .DefaultEditInline-input').attr('placeholder')).toContain('Add tags...');
      expect($(this.html).find('.MapCard-contentTags .DefaultEditInline-input').val()).toBe('');
    });
  });

  describe('permission', function() {
    it('shouldn\'t show permission label when user is not in a org', function() {
      this.renderView();
      expect($(this.html).find('.PermissionIndicator').length).toBe(0);
    });

    it("shouldn\'t show permission label when user is the owner of the vis", function() {
      this.vis.permission = new cdb.admin.Permission();
      
      userMock = sinon.mock(this.user);
      userMock.expects('isInsideOrg').returns(true);
      
      permissionMock = sinon.mock(this.vis.permission);
      permissionMock.expects('isOwner').withArgs(this.user).returns(true);
      permissionMock.expects('getPermission').withArgs(this.user).returns('w');
      
      ownerMock = sinon.mock(this.vis.permission.owner);
      ownerMock.expects('get').withArgs('username').returns('paco');
      ownerMock.expects('renderData').withArgs(this.user).returns(this.user.toJSON());

      this.renderView();
      expect($(this.html).find('.PermissionIndicator').length).toBe(0);
    });

    it("should show permission label when user is not the owner of the vis and he is in a org", function() {
      this.vis.permission = new cdb.admin.Permission();
      var u1 = new cdb.admin.User({ username: 'whoknows' });
      
      userMock = sinon.mock(this.user);
      userMock.expects('isInsideOrg').returns(true);
      
      permissionMock = sinon.mock(this.vis.permission);
      permissionMock.expects('isOwner').withArgs(this.user).returns(false);
      permissionMock.expects('getPermission').withArgs(this.user).returns('r');
      
      ownerMock = sinon.mock(this.vis.permission.owner);
      ownerMock.expects('get').withArgs('username').returns('whoknows');
      ownerMock.expects('renderData').withArgs(this.user).returns(u1.toJSON());

      this.renderView();
      expect($(this.html).find('.PermissionIndicator').length).toBe(1);
      expect($(this.html).find('.PermissionIndicator').text()).toBe('READ');
    });
  });

  describe('click item', function() {
    beforeEach(function() {
      spyOn(this.view, 'killEvent');
      this.renderView();
    });

    describe('given clicked element is a link (e.g. dataset title)', function() {
      beforeEach(function() {
        this.view.$('a').click();
      });

      it('should let the link be handled as normal', function() {
        expect(this.view.killEvent).not.toHaveBeenCalled();
      });
    });

    describe('given clicked target is NOT a link', function() {
      beforeEach(function() {
        this.clickEl = function() {
          this.view.$el.click();
        };
        this.clickEl();
      });

      it('should kill default event behaviour', function() {
        expect(this.view.killEvent).toHaveBeenCalledWith(this.view.killEvent.calls.argsFor(0)[0]);
      });

      it('should toggle selected state on dataset', function() {
        expect(this.vis.get('selected')).toBeTruthy();

        this.clickEl();
        expect(this.vis.get('selected')).toBeFalsy();
      });
    });
  });

  it('should have no leaks', function() {
    this.renderView();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
