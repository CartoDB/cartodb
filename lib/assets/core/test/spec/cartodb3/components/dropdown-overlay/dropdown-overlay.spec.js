var $ = require('jquery');
var DropdownOverlayView = require('../../../../../javascripts/cartodb3/components/dropdown-overlay/dropdown-overlay-view');

describe('components/dropdown-overlay/dropdown-overlay', function () {
  beforeEach(function () {
    this.view = new DropdownOverlayView();
    this.view.render();
  });

  it('should append itself to document body when rendered', function () {
    expect($('body').find('.CDB-Box-modalOverlay').length).toEqual(1);
  });

  it('should be append inside modal element if dropdown is inside modal', function () {
    var dropdownElement = $('<div class="Dialog"></div>');
    var dropdownInsideModalOverlay = new DropdownOverlayView({
      dropdownElement: dropdownElement
    });
    dropdownInsideModalOverlay.render();

    expect(dropdownElement.find('.CDB-Box-modalOverlay').length).toBe(1);
  });

  it('should hide overlay when clicked', function () {
    spyOn(this.view, 'hide').and.callThrough();
    $('.CDB-Box-modalOverlay').click();
    expect(this.view.hide).toHaveBeenCalled();
  });

  it('should trigger "overlayClicked" event when clicked', function () {
    spyOn(this.view, 'trigger');
    $('.CDB-Box-modalOverlay').click();
    expect(this.view.trigger).toHaveBeenCalledWith('overlayClicked', this.view);
  });

  it('should be hidden when hide is invoked', function () {
    this.view.hide();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('none');
  });

  it('should be shown when shown is invoked', function () {
    $('.CDB-Box-modalOverlay').css('display', 'none');
    this.view.show();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('block');
  });

  it('should apply new visibility state when toggle is invoked', function () {
    this.view.toggle(false);
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('none');
    this.view.toggle(true);
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('block');
  });

  it('should remove overlay node from body when view is removed', function () {
    this.view.remove();
    expect($('body').find('.CDB-Box-modalOverlay').length).toEqual(0);
  });

  it('should remove overlay node from body when view is cleaned', function () {
    this.view.clean();
    expect($('body').find('.CDB-Box-modalOverlay').length).toEqual(0);
  });
});
