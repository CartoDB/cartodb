describe('common.ui.Dropdown', function() {
  beforeEach(function() {
    this.$el = $('<div><button id="btn"></button></div>');
    this.view = new cdb.ui.common.Dropdown({
      el: $('<div>'),
      target: this.$el.find('#btn')
    });
  });

  describe('.clean', function() {
    it('should unbind click handler on target', function() {
      this.targetClickSpy = jasmine.createSpy('click');
      this.$el.on('click', this.targetClickSpy);

      // Event should not bubble up since there is a handler that prevents it
      this.$el.find('#btn').click();
      expect(this.targetClickSpy).not.toHaveBeenCalled();

      // Verify click bubbles up as expected again
      this.view.clean();
      this.$el.find('#btn').click();
      expect(this.targetClickSpy).toHaveBeenCalled();
    });

    it('should unbind event handlers on document', function() {
      // spy on internal call, since spying on _keydown fn do not work for some reason
      spyOn(this.view, 'hide');
      var keyEsc = function() {
        var e = $.Event('keydown');
        e.keyCode = 27; // ESC
        $(document).trigger(e);
      };

      // Should hide on ESC
      keyEsc();
      expect(this.view.hide).toHaveBeenCalled();

      // Callback should not be triggered again
      this.view.clean();
      keyEsc();
      expect(this.view.hide.calls.count()).toEqual(1);
    });
  });
});
