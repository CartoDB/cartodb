var BaseDialog = require('new_common/views/base_dialog/view');

describe('new_common/views/base_dialog/view', function() {
  beforeEach(function() {
    var DialogExample = BaseDialog.extend({
      render_content: function() {
        return '<blink>foobar content</blink>';
      }
    });

    this.view = new DialogExample({
    });

    this.view.render();
    this.html = function() {
      // To get HTML including the view's own root element:
      return $('<div />').append($(this.view.el).clone()).html();
    }
  });

  it('should render a close button', function() {
    expect(this.html()).toContain('close');
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
      spyOn(cdb.ui.common.Dialog.prototype, '_cancel');
      jasmine.clock().install();
      this.view.$('.close').click();
    });

    it('should start the scale-out animation', function() {
      expect(this.html()).toContain('Dialog--closing');
    });

    it('should call original cancel fn (to close and remove the view) after the animation finished', function() {
      jasmine.clock().tick(101);
      expect(cdb.ui.common.Dialog.prototype._cancel).toHaveBeenCalled();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
