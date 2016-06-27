var cdb = require('cartodb.js-v3');
var PublishView = require('../../../../../../javascripts/cartodb/common/dialogs/publish/publish_view');

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

describe('common/dialogs/publish/publish_view', function() {
  beforeEach(function() {
    this.user = jasmine.createSpy('user');
    this.vis = new cdb.admin.Visualization({
      id: 'abc-123',
      privacy: 'PRIVATE'
    });
    spyOn(this.vis, 'embedURL').and.returnValue('https://cartodb.com/user/pepe/viz/abc-123/embed_map');
    spyOn(this.vis, 'vizjsonURL').and.returnValue('https://cartodb.com/user/pepe/api/v2/viz/abc-123/viz.json');
    spyOn(this.vis, 'publicURL').and.returnValue('https://cartodb.com/user/pepe/api/v2/viz/abc-123/public_map');

    this.view = new PublishView({
      model: this.vis,
      user: this.user,
      clean_on_hide: true
    });
    this.view.render();
  });

  describe('when map is private', function() {
    sharedTests.call(this);

    it('should render alternative views for map and embed options', function() {
      expect(this.innerHTML()).toContain('is private');
      expect(this.innerHTML()).toContain('js-change-privacy');
    });

    describe('when clicking any change privacy link', function() {
      beforeEach(function() {
        var self = this;
        this.privacyModal = jasmine.createSpyObj('PrivacyDialog', ['appendToBody', 'unbind', 'bind', 'close']);
        cdb.editor.ChangePrivacyView = function() {
          return self.privacyModal;
        };
        spyOn(this.view, 'close');
        spyOn(this.view, 'show');
        this.view.$el.find('.js-change-privacy').click();
      });

      it('should hide the publish modal but not clean it', function() {
        expect(this.view.close).toHaveBeenCalled();
        expect(this.view.options.clean_on_hide).toBeFalsy();
      });

      it('should show the privacy modal instead', function() {
        expect(this.privacyModal.appendToBody).toHaveBeenCalled();
      });

      it('should listen to hide event on the privacy modal', function() {
        expect(this.privacyModal.bind).toHaveBeenCalled();
        expect(this.privacyModal.bind.calls.argsFor(0)[0]).toEqual('hide');
      });

      describe('when privacy modal finishs', function() {
        beforeEach(function() {
          this.privacyModal.bind.calls.argsFor(0)[1].call(window);
        });

        it('should restore clean_on_hide value', function() {
          expect(this.view.options.clean_on_hide).toBeTruthy();
        });

        it('should show publish modal again', function() {
          expect(this.view.show).toHaveBeenCalled();
        });

        it('should clean the privacy modal', function() {
          // clean_on_hide: true on the creation of the privacy modal made the publish modal also to be removed :/
          expect(this.privacyModal.close).toHaveBeenCalled();
        });

        it('should unbind privayModal', function() {
          expect(this.privacyModal.unbind).toHaveBeenCalledWith('hide', jasmine.any(Function));
        });

        it('should have no leaks', function() {
          expect(this.view).toHaveNoLeaks();
        });
      });
    });
  });

  describe('when map is not private', function() {
    sharedTests.call(this);

    beforeEach(function() {
      this.vis.set('privacy', 'LINK');
    });

    it('should render the embed option', function() {
      expect(this.innerHTML()).toContain('iframe width=&quot;100%&quot; height=&quot;520&quot; frameborder=&quot;0&quot; src=&quot;https://cartodb.com/user/pepe/viz/abc-123/embed_map&quot; allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen');
    });

    it('should render the dev cartodb.js option', function() {
      expect(this.innerHTML()).toContain('https://cartodb.com/user/pepe/api/v2/viz/abc-123/viz.json');
    });

  });
});
