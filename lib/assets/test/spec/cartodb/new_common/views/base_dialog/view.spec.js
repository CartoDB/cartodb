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

  });

  describe('.render', function() {
    beforeEach(function() {
      this.view.render();
      this.html = this.view.el.innerHTML;
    });

    it('should render a close button', function() {
      expect(this.html).toContain('close');
    });

    it('should render the content of .render_content', function() {
      expect(this.html).toContain('foobar content');
    });

    it('should expected the implementing child view to escape its content', function() {
      expect(this.html).toContain('<blink>');
    });

    it('should have no leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
