var BaseDialog = require('../../../../../../javascripts/cartodb/new_common/views/base_dialog/view');
var $ = require('jquery');
var cdb = require('cartodb.js');

describe('new_common/views/base_dialog/view', function() {
  beforeEach(function() {
    var DialogExample = BaseDialog.extend({
      render_content: function() {
        return '<blink>foobar content</blink>';
      }
    });

    this.view = new DialogExample({
    });

    cdb.god.bind('dialogOpened', function() {
      this.dialogOpened = true;
    }, this);
    cdb.god.bind('dialogClosed', function() {
      this.dialogClosed = true;
    }, this);

    this.view.render();
    this.html = function() {
      // To get HTML including the view's own root element:
      return $('<div />').append($(this.view.el).clone()).html();
    };

  });

  it('should render a close button', function() {
    expect(this.html()).toContain('close');
  });

  it('should trigger a dialogOpened event on the global eventbus', function() {
    expect(this.dialogOpened).toBeTruthy();
  });

  it('should render the content of .render_content', function() {
    expect(this.html()).toContain('foobar content');
  });

  it('should expected the implementing child view to escape its content', function() {
    expect(this.html()).toContain('<blink>');
  });

  it('should have no leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  describe('click close', function() {
    beforeEach(function() {
      jasmine.clock().install();
      $('body').append(this.view.$el); // necessary for .is-assertions below
      this.view.$('.close').click();
    });

    it('should start the scale-out animation', function() {
      expect(this.html()).toContain('is-closing');
    });

    it('should hide but after the animation finished', function() {
      expect(this.view.$el.is(':visible')).toBeTruthy();
      jasmine.clock().tick(101);
      expect(this.view.$el.is(':hidden')).toBeTruthy();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });

  describe('.close', function() {
    beforeEach(function() {
      jasmine.clock().install();
      $('body').append(this.view.$el); // necessary for .is-assertions below
      this.view.close();
    });

    it('should start the scale-out animation', function() {
      expect(this.html()).toContain('is-closing');
    });

    it('should hide but after the animation finished', function() {
      expect(this.view.$el.is(':visible')).toBeTruthy();
      jasmine.clock().tick(101);
      expect(this.view.$el.is(':hidden')).toBeTruthy();
    });

    it('should trigger a dialogClosed event on the global eventbus', function() {
      expect(this.dialogClosed).toBeFalsy();
      jasmine.clock().tick(101);
      expect(this.dialogClosed).toBeTruthy();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });

  describe('.render', function() {
    it('should return itself per backbone standard', function() {
      expect(this.view.render()).toBe(this.view);
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
