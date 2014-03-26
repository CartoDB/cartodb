describe('UserMenu', function() {
  var view;
  beforeEach(function() {
    view = new cdb.admin.DropdownMenu({
      speedIn: 250
    });
  });

  it("should open at position x, y", function(done) {

    view.openAt(11, 12)

    setTimeout(function() {

      expect(view.$el.css('opacity')).not.toEqual('0');
      expect(view.$el.css('top')).toEqual('12px');
      expect(view.$el.css('left')).toEqual('11px');

      done();

    }, 300);
  });
});
