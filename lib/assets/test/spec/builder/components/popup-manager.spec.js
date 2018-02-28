var CoreView = require('backbone/core-view');
var PopupManager = require('builder/components/popup-manager');

describe('components/popup-manager', function () {
  beforeEach(function () {
    this.ref = new CoreView({
      className: 'dom-reference'
    });

    this.dialog = new CoreView({
      className: 'dom-dialog'
    });

    this.popupManager = new PopupManager('foo', this.ref.$el, this.dialog.$el);
  });

  afterEach(function () {
    this.popupManager.destroy();
  });

  it('append nested', function () {
    this.popupManager.append('nested');
    expect(this.ref.el.contains(this.dialog.el)).toBe(true);
    expect(document.querySelectorAll('body > [data-dialog]').length).toBe(0);
  });

  it('append float', function () {
    this.popupManager.append('float');
    expect(this.ref.el.contains(this.dialog.el)).toBe(false);
    expect(document.querySelectorAll('body > [data-dialog]').length).toBe(1);
  });

  it('track nested', function () {
    spyOn(this.popupManager, 'reposition');
    this.popupManager.append('nested');

    this.popupManager.track();
    expect(this.popupManager.emitter).toBeFalsy();
    expect(this.popupManager.reposition).not.toHaveBeenCalled();
  });

  it('track float', function () {
    spyOn(this.popupManager, 'reposition');
    this.popupManager.append('float');

    this.popupManager.track();
    expect(this.popupManager.emitter).toBeTruthy();
    expect(this.popupManager.reposition).toHaveBeenCalled();
  });

  it('destroy', function () {
    spyOn(this.popupManager, 'untrack').and.callThrough();

    this.popupManager.append('float');
    this.popupManager.destroy();

    expect(this.popupManager.untrack).toHaveBeenCalled();
    expect(document.querySelectorAll('body > [data-dialog]').length).toBe(0);
  });
});
