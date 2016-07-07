var MapItem = require('../../../../../javascripts/cartodb/dashboard/maps/maps_item');
var Router = require('../../../../../javascripts/cartodb/dashboard/router');
var cdb = require('cartodb.js-v3');

describe('dashboard/maps/maps_item', function() {
  beforeEach(function() {
    var ownerAttrs = {
      id: 'owner-id',
      base_url: 'http://team.carto.com/u/pepe',
      username: 'pepe'
    }

    this.vis = new cdb.admin.Visualization({
      id: '8988-8888-8888',
      name: 'map_title',
      privacy: 'PUBLIC',
      type: 'derived',
      updated_at: (new Date()).toISOString(),
      likes: 42,
      permission: {
        owner: ownerAttrs
      }
    });

    spyOn(this.vis, 'on');

    this.user = new cdb.admin.User(ownerAttrs);

    this.router = new Router({
      dashboardUrl: this.user.viewUrl().dashboard()
    });
    this.router.model.set('content_type', 'maps');

    this.view = new MapItem({
      model: this.vis,
      user: this.user,
      router: this.router
    });

    this.renderView = function() {
      this.view.render();
    };
  });

  it('should render if privacy changes', function() {
    expect(this.vis.on).toHaveBeenCalledWith('change:privacy', this.view.render, this.view);
  });

  it('should render the title', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('map_title');
  });

  it('should render the URL to the edit map', function() {
    this.renderView();
    expect(this.innerHTML()).toContain('http://team.carto.com/u/pepe/viz/8988-8888-8888/map');
  });

  it('should render likes count', function() {
    this.renderView();
    expect(this.view.$('.LikesIndicator').length).toBe(1);
    expect(this.view.$('.LikesIndicator').text()).toContain('42');
  });

  it('should render privacy', function() {
    this.renderView();
    expect(this.view.$('.js-privacy').length).toBe(1);
    expect(this.view.$('.js-privacy').text()).toBe('public');
    expect(this.view.$('.js-privacy').hasClass('is-public')).toBeTruthy();
  });

  it('should add "selectable" class if user is owner of the map', function() {
    spyOn(this.vis.permission, 'isOwner').and.returnValue(true);
    this.renderView();
    expect(this.view.$('.MapCard').hasClass('MapCard--selectable')).toBeTruthy();
  });

  it('should remove "selectable" class if user is NOT owner of the map', function() {
    spyOn(this.vis.permission, 'isOwner').and.returnValue(false);
    this.renderView();
    expect(this.view.$('.MapCard').hasClass('MapCard--selectable')).toBeFalsy();
  });

  describe('render owner user info', function() {

    it('shouldn\'t render owner info if user is not in a org', function() {
      this.renderView();
      expect(this.view.$('.UserAvatar').length).toBe(0);
    });

    it("shouldn't render owner info if user is the owner of the map", function() {
      spyOn(this.user, 'isInsideOrg').and.returnValue(true);

      spyOn(this.vis.permission, 'isOwner').and.returnValue(true);
      spyOn(this.vis.permission, 'hasWriteAccess').and.returnValue(true);

      spyOn(this.vis.permission.owner, 'get').and.returnValue('paco');
      spyOn(this.vis.permission.owner, 'renderData').and.returnValue(this.user.toJSON());

      this.renderView();
      expect(this.view.$('.UserAvatar').length).toBe(0);
    });

    it('should render owner info if user is not the owner of the map', function() {
      this.vis.permission = new cdb.admin.Permission();
      var u1 = new cdb.admin.User({ username: 'whoknows' });

      spyOn(this.user, 'isInsideOrg').and.returnValue(true);

      spyOn(this.vis.permission, 'isOwner').and.returnValue(false);
      spyOn(this.vis.permission, 'hasWriteAccess').and.returnValue(false);

      spyOn(this.vis.permission.owner, 'get').and.returnValue('whoknows');
      spyOn(this.vis.permission.owner, 'renderData').and.returnValue(u1.toJSON());

      this.renderView();
      expect(this.view.$('.UserAvatar').length).toBe(1);
      expect(this.view.$('.UserAvatar').attr('data-title')).toBe('whoknows');
    });

  });

  it('should render timediff', function() {
    this.renderView();
    expect(this.view.$('.MapCard-contentFooterTimeDiff').length).toBe(1);
    expect(this.view.$('.MapCard-contentFooterTimeDiff').text()).toContain('a few seconds ago');
  });

  it('should render mapviews graph', function() {
    this.renderView();
    expect(this.view.$('.MapviewsGraph').length).toBe(1);
    expect(this.view.$('.MapviewsGraph svg').length).toBe(1);
  });

  it('should render an editable field with the description', function() {
    this.vis.set('description', 'my desc');
    this.renderView();
    expect(this.view.$('.MapCard-desc.EditableField').length).toBe(1);
    expect(this.view.$('.js-description').length).toBe(1);
    expect(this.view.$('.js-description')[0].textContent).toEqual('my desc');
  });

  it('should render an editable field with the tags', function() {
    this.vis.set('tags', ['tag1']);
    this.renderView();
    expect(this.view.$('.MapCard-tags.EditableField').length).toBe(1);
    expect(this.view.$('.js-tag-link').length).toBe(1);
    expect(this.view.$('.js-tag-link')[0].textContent).toEqual('tag1');
  });

  describe('permission', function() {
    it('shouldn\'t show permission label when user is not in a org', function() {
      this.renderView();
      expect(this.view.$('.PermissionIndicator').length).toBe(0);
    });

    it("shouldn\'t show permission label when user is the owner of the vis", function() {
      spyOn(this.user, 'isInsideOrg').and.returnValue(true);

      spyOn(this.vis.permission, 'isOwner').and.returnValue(true);
      spyOn(this.vis.permission, 'hasWriteAccess').and.returnValue(true);

      spyOn(this.vis.permission.owner, 'get').and.returnValue('paco');
      spyOn(this.vis.permission.owner, 'renderData').and.returnValue(this.user.toJSON());

      this.renderView();
      expect(this.view.$('.PermissionIndicator').length).toBe(0);
    });

    it("should show permission label when user is not the owner of the vis and he is in a org", function() {
      this.vis.permission = new cdb.admin.Permission();
      var u1 = new cdb.admin.User({ username: 'whoknows' });

      spyOn(this.user, 'isInsideOrg').and.returnValue(true);

      spyOn(this.vis.permission, 'isOwner').and.returnValue(false);
      spyOn(this.vis.permission, 'hasWriteAccess').and.returnValue(false);

      spyOn(this.vis.permission.owner, 'get').and.returnValue('whoknows');
      spyOn(this.vis.permission.owner, 'renderData').and.returnValue(u1.toJSON());

      this.renderView();
      expect(this.view.$('.PermissionIndicator').length).toBe(1);
    });
  });

  describe('click item', function() {
    describe('given clicked target is NOT a link', function() {
      beforeEach(function() {
        spyOn(this.view, 'killEvent');
        this.clickEl = function() {
          this.view.$el.click();
        };
        this.clickEl();
      });

      it('should kill default event behaviour', function() {
        expect(this.view.killEvent).toHaveBeenCalledWith(this.view.killEvent.calls.argsFor(0)[0]);
      });

      describe('should toggle selected state on map card', function() {
        beforeEach(function() {
          this.vis.set('selected', false);
        });

        it('if user is owner of the map', function() {
          spyOn(this.vis.permission, 'isOwner').and.returnValue(true);
          this.clickEl();
          expect(this.vis.get('selected')).toBeTruthy();
        });

        it('if user is NOT owner of the map', function() {
          spyOn(this.vis.permission, 'isOwner').and.returnValue(false);
          this.clickEl();
          expect(this.vis.get('selected')).toBeFalsy();
        });

      });
    });
  });

  describe('when click .js-privacy', function() {
    beforeEach(function() {
      this.renderView();
      cdb.god.bind('openPrivacyDialog', function(vis) {
        this.openendPrivacyDialog = vis;
      }, this);
      this.view.$('.js-privacy').click();
    });

    it('should call global event bus to open privacy dialog', function() {
      expect(this.openendPrivacyDialog).toBeTruthy();
    });

    it('should created dialog with selected items', function() {
      expect(this.openendPrivacyDialog).toEqual(this.vis);
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
