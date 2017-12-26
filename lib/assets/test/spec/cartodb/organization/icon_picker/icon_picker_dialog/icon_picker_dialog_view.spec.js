var _ = require('underscore-cdb-v3');
var IconPickerDialog = require('../../../../../../javascripts/cartodb/organization/icon_picker/icon_picker_dialog/icon_picker_dialog_view');

describe('organization/icon_picker/icon_picker_dialog/icon_picker_dialog_view', function () {
  var orgId = '5p3c724-1ndv572135';

  beforeEach(function () {
    this.view = new IconPickerDialog({
      orgId: orgId
    });

    this.view.render();
  });

  afterEach(function () {
    this.view.clean();
  });

  it('should render properly', function () {
    expect(this.view.$el.html()).toContain('Organization icons');

    expect(this.view.$('.js-dialogIconPicker').length).toBe(1);
    expect(_.size(this.view._subviews)).toBe(1); // iconPicker
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  // from ../icons/organization_icons_view.spec
  describe('._onAddIconClicked', function () {
    it('should hide error message, trigger input click and prevent default', function () {
      var clickTriggered = false;
      this.view.$('.js-inputFile').on('click', function () {
        clickTriggered = true;
      });
      spyOn(this.view, '_hideErrorMessage');
      spyOn(this.view, 'killEvent').and.callThrough();

      this.view._onAddIconClicked();

      expect(this.view._hideErrorMessage).toHaveBeenCalled();
      expect(this.view.killEvent).toHaveBeenCalled();
      expect(clickTriggered).toBe(true);
    });
  });

  describe('_hideErrorMessage', function () {
    it('should hide error message', function () {
      spyOn(this.view, '_hide');

      this.view._hideErrorMessage();

      expect(this.view._hide).toHaveBeenCalledWith('.js-errorMessage');
    });
  });

  describe('_hide', function () {
    it('_hide adds `is-hidden` class', function () {
      // Premise: an element with no `is-hidden` class exists
      var $shownElement = this.view.$('.js-iconsInfo');
      expect($shownElement.length).toBeGreaterThan(0);
      expect($shownElement.hasClass('is-hidden')).toBe(false);

      this.view._hide('.js-iconsInfo');

      expect($shownElement.hasClass('is-hidden')).toBe(true);
    });
  });

  describe('._onIsProcessRunningChanged', function () {
    it('should disable all events if icon picker is running a process', function () {
      this.view.icon_picker.model.set('isProcessRunning', true);

      expect(this.view.$el.css('pointer-events')).toBe('none');
    });

    it('should enable all events if icon picker is not running a process', function () {
      this.view.icon_picker.model.set('isProcessRunning', true);
      this.view.icon_picker.model.set('isProcessRunning', false);

      expect(this.view.$el.css('pointer-events')).toBe('auto');
    });
  });
});
