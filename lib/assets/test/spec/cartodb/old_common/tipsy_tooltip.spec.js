describe('TipsyTooltip', function() {

  var view, $el;

  beforeEach(function() {
    $el = $('<a>').addClass('tooltip').attr('title', 'hello title');
    $('body').append($el);
    view = new cdb.common.TipsyTooltip({
      el: $el
    });
  });

  afterEach(function() {
    
  });

  it("should destroy properly", function(done) {
    $el.data().tipsy.show();
    var $tip = $el.data().tipsy.$tip;
    var attached_events = [];
    view.clean();

    if ($._data(  $el[0], "events" )) {
      $.each($._data(  $el[0], "events" ), function(e) {
        attached_events.push(e)
      });
    }

    setTimeout(function() {
      expect($('body').find('.tipsy').length).toBe(0);
      expect(_.contains(attached_events, 'mouseover')).toBeFalsy();
      expect(_.contains(attached_events, 'mouseout')).toBeFalsy();
      done();
    },1000);
    
  });

});
