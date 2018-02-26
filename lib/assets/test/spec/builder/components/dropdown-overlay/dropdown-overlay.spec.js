var $ = require('jquery');
var DropdownOverlayView = require('builder/components/dropdown-overlay/dropdown-overlay-view');

describe('components/dropdown-overlay/dropdown-overlay', function () {
  beforeEach(function () {
    this.onClickAction = jasmine.createSpy('onClickAction');
    this.view = new DropdownOverlayView({
      onClickAction: this.onClickAction
    });
    this.view.render();
  });

  it('should append itself to document body when rendered', function () {
    expect($('body').find('.CDB-Box-modalOverlay').length).toEqual(1);
  });

  it('should be appended inside container if any', function () {
    var modalElement = $('<div class="Dialog"></div>');
    var dropdownInsideModalOverlay = new DropdownOverlayView({
      container: modalElement
    });
    dropdownInsideModalOverlay.render();

    expect(modalElement.find('.CDB-Box-modalOverlay').length).toBe(1);
  });

  it('should be hidden when visible is false in initialization', function () {
    var dropdownOverlay = new DropdownOverlayView({
      visible: false
    });
    dropdownOverlay.render();

    expect(dropdownOverlay.$el.css('display')).toBe('none');

    dropdownOverlay.clean();
  });

  it('should hide overlay when clicked', function () {
    spyOn(this.view, 'hide').and.callThrough();
    $('.CDB-Box-modalOverlay').click();
    expect(this.view.hide).toHaveBeenCalled();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('none');
  });

  it('should invoke onClickAction when clicked', function () {
    $('.CDB-Box-modalOverlay').click();
    expect(this.onClickAction).toHaveBeenCalled();
  });

  it('should be hidden when hide is invoked', function () {
    this.view.hide();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('none');
  });

  it('should be shown when show is invoked', function () {
    this.view.hide();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('none');
    this.view.show();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('block');
  });

  it('should apply new visibility state when toggle is invoked', function () {
    this.view.toggle();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('block');
    this.view.toggle();
    expect($('.CDB-Box-modalOverlay').css('display')).toBe('none');
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
