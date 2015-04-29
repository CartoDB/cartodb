var cdb = require('cartodb.js');
var PublishView = require('../../../../../../javascripts/cartodb/new_common/dialogs/publish/publish_view');

var sharedTests = function() {
  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render fine', function() {
    expect(this.innerHTML()).toContain('Publish your map');
  });

  it('should render the options', function() {
    expect(this.innerHTML()).toContain('OptionCard');
    expect(this.view.$el.find('.OptionCard').length).toEqual(3);
  });
};

describe('new_common/dialogs/publish/publish_view', function() {
  beforeEach(function() {
    this.vis = new cdb.admin.Visualization({
      id: 'abc-123'
    });
    spyOn(this.vis, 'embedURL').and.returnValue('http://cartodb.com/user/pepe/viz/abc-123/embed_map');
    spyOn(this.vis, 'vizjsonURL').and.returnValue('https://cartodb.com/user/pepe/api/v2/viz/abc-123/viz.json');
    spyOn(this.vis, 'publicURL').and.returnValue('https://cartodb.com/user/pepe/api/v2/viz/abc-123/public_map');

    var self = this;
    this.urlShortener = jasmine.createSpyObj('UrlShortener', ['fetch']);
    cdb.editor = {
      UrlShortener: function() {
        return self.urlShortener;
      }
    };
  });

  describe('when map is private', function() {
    beforeEach(function() {
      this.vis.set('privacy', 'PRIVATE');
      this.view = new PublishView({
        model: this.vis
      });
      this.view.render();
    });

    sharedTests.call(this);

    it('should not try to shorten the public URL', function() {
      expect(this.urlShortener.fetch).not.toHaveBeenCalled();
    });

    it('should render alternative views for map and embed options', function() {
      expect(this.innerHTML()).toContain('is private');
      expect(this.innerHTML()).toContain('js-change-privacy');
    });

    describe('when clicking any change privacy link', function() {
      beforeEach(function() {
        this.listener = jasmine.createSpy('openPrivacyDialog');
        cdb.god.bind('openPrivacyDialog', this.listener);
        this.view.$el.find('.js-change-privacy').click();
      });

      it('should trigger event to open change privacy modal', function() {
        expect(this.listener).toHaveBeenCalled();
        expect(this.listener).toHaveBeenCalledWith(this.vis);
      });
    });
  });

  describe('when map is not private', function() {
    beforeEach(function() {
      this.view = new PublishView({
        model: this.vis
      });
      this.view.render();
    });

    sharedTests.call(this);

    it('should render the embed option', function() {
      expect(this.innerHTML()).toContain('<iframe width=&quot;100%&quot; height=&quot;520&quot; frameborder=&quot;0&quot; src=&quot;http://cartodb.com/user/pepe/viz/abc-123/embed_map&quot; allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>');
    });

    it('should render the dev cartodb.js option', function() {
      expect(this.innerHTML()).toContain('https://cartodb.com/user/pepe/api/v2/viz/abc-123/viz.json');
    });

    it('should get shorter public URL', function() {
      expect(this.urlShortener.fetch).toHaveBeenCalledWith(
        'https://cartodb.com/user/pepe/api/v2/viz/abc-123/public_map',
        jasmine.objectContaining({
          success: jasmine.any(Function),
          error: jasmine.any(Function)
        }
      ));
    });

    describe('when url shortening succeeds', function() {
      beforeEach(function() {
        this.urlShortener.fetch.calls.argsFor(0)[1].success('cdb.io/abc123');
      });

      it('should set shorter url as new copyable content', function() {
        expect(this.innerHTML()).toContain('cdb.io/abc123');
      });
    });

    describe('when shorter URL could not be retrieved', function() {
      beforeEach(function() {
        this.urlShortener.fetch.calls.argsFor(0)[1].error('/viz/abc-123/public_map');
      });

      it('should render the original public URL', function() {
        expect(this.innerHTML()).toContain('/public_map');
      });
    });
  });
});
