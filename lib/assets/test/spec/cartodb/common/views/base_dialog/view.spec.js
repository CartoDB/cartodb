var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../../../../../javascripts/cartodb/common/views/base_dialog/view');

describe('common/views/base_dialog/view', function() {
  beforeEach(function() {
    var DialogExample = BaseDialog.extend({
      render_content: function() {
        return '<blink>foobar content</blink>' +
        '<button class="cancel">cancel</button>' +
        '<button class="ok">OK</button>';
      }
    });

    this.view = new DialogExample();

    cdb.god.bind('dialogOpened', function() {
      this.dialogOpened = true;
    }, this);
    cdb.god.bind('dialogClosed', function() {
      this.dialogClosed = true;
    }, this);

    this.view.render();
  });

  it('should render a close button', function() {
    expect(this.innerHTML()).toContain('close');
  });

  it('should trigger a dialogOpened event on the global eventbus', function() {
    expect(this.dialogOpened).toBeTruthy();
  });

  it('should render the content of .render_content', function() {
    expect(this.innerHTML()).toContain('foobar content');
  });

  it('should expected the implementing child view to escape its content', function() {
    expect(this.innerHTML()).toContain('<blink>');
  });

  it('should return false if is not sticky', function() {
    expect(this.view._isSticky()).toBeFalsy();
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('sticky', function() {
    beforeEach(function() {
      jasmine.clock().install();

      var DialogExample = BaseDialog.extend({
        render_content: function() {
          return '<blink>foobar content</blink>' +
            '<button class="cancel">cancel</button>' +
            '<button class="ok">OK</button>';
        }
      });

      this.stickyView = new DialogExample({ sticky: true });
      this.stickyView.render();
      $('body').append(this.stickyView.$el); // necessary for .is-assertions below

      this.hideCallback = jasmine.createSpy('hide');
      this.stickyView.bind('hide', this.hideCallback);
      this.stickyView.$('.cancel').click();
    });

    it("should be sticky", function() {
      expect(this.stickyView._isSticky()).toBeTruthy();
    });

    it("shouldn\'t trigger a hide event", function() {
      expect(this.hideCallback).not.toHaveBeenCalled();
      jasmine.clock().tick(101);
      expect(this.hideCallback.calls.count()).toEqual(0);
    });

    it("should add the sticky class", function() {
      expect(this.stickyView.$el.hasClass("is-sticky")).toBeTruthy();
    });

    afterEach(function() {
      this.stickyView.clean();
      jasmine.clock().uninstall();
    });
  });

  describe('when click close', function() {
    beforeEach(function() {
      jasmine.clock().install();
      $('body').append(this.view.$el); // necessary for .is-assertions below
      this.hideCallback = jasmine.createSpy('hide');
      this.view.bind('hide', this.hideCallback);
      this.view.$('.close').click();
    });

    it('should start the scale-out animation', function() {
      expect(this.view.el.className).toContain('is-closing');
    });

    it('should hide but after the animation finished', function() {
      expect(this.view.$el.is(':visible')).toBeTruthy();
      jasmine.clock().tick(101);
      expect(this.view.$el.is(':hidden')).toBeTruthy();
    });

    it('should trigger a hide event but just once', function() {
      expect(this.hideCallback).toHaveBeenCalled();
      jasmine.clock().tick(101);
      expect(this.hideCallback.calls.count()).toEqual(1);
    });

    it('should trigger a dialogClosed event on the global eventbus', function() {
      expect(this.dialogClosed).toBeTruthy();
    });

    describe('when there is a cancel callback', function() {
      beforeEach(function() {
        this.view.cancel = jasmine.createSpy('cancel callback');
        this.view.$('.close').click();
      });

      it('should call cancel callback', function() {
        expect(this.view.cancel).not.toHaveBeenCalled();
        jasmine.clock().tick(101);
        expect(this.view.cancel).toHaveBeenCalled();
      });
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });

  describe('when click ok', function() {
    beforeEach(function() {
      spyOn(this.view, 'close');
      this.clickOK = function() {
        this.view.$el.find('.ok').click();
      };
    });

    describe('when there is no ok method defined', function() {
      beforeEach(function() {
        this.clickOK();
      });

      it('should close the view by default', function() {
        expect(this.view.close).toHaveBeenCalled();
      });
    });

    describe('when there is a ok method defined on view', function() {
      beforeEach(function() {
        this.view.ok = jasmine.createSpy('ok');
        this.clickOK();
      });

      it('should not close the view', function() {
        expect(this.view.close).not.toHaveBeenCalled();
      });

      it('should have called the ok method instead', function() {
        expect(this.view.ok).toHaveBeenCalled();
      });
    });
  });

  describe('.render', function() {
    it('should return itself per backbone standard', function() {
      expect(this.view.render()).toBe(this.view);
    });
  });

  describe('.open', function() {
    beforeEach(function() {
      this.showCallback = jasmine.createSpy('show');
      this.view.bind('show', this.showCallback);
      this.view.open();
    });

    it('should trigger an show event', function() {
      expect(this.showCallback).toHaveBeenCalled();
    });
  });

  describe('.close', function() {
    beforeEach(function() {
      jasmine.clock().install();
      this.view.cancel = jasmine.createSpy('cancel callback');
      this.view.close();
      jasmine.clock().tick(101);
    });

    it('should not called cancel callback', function() {
      expect(this.view.cancel).not.toHaveBeenCalled();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
