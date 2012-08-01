describe('UserMenu', function() {
  var view;
  beforeEach(function() {
    view = new cdb.admin.UserMenu({
      speedIn: 250
    });
  });

  it("should open at position x, y", function() {
    var shown = false;
    runs(function() {
      view.openAt(11, 12);
      setTimeout(function() {
        shown = true;
      }, view.options.speedIn + 100);

    });

    waitsFor(function() {
      return shown;
    }, "should be shown", view.options.speedIn + 100);

    runs(function() {
      expect(view.$el.css('opacity')).toEqual('1');
      expect(view.$el.css('top')).toEqual('12px');
      expect(view.$el.css('left')).toEqual('11px');
    });

  });
});
