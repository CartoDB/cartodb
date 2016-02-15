var ModalViewModel = require('../../../../../javascripts/cartodb3/components/modals/modal-view-model');

describe('components/modals/modal-view-model', function () {
  beforeEach(function () {
    this.createContentViewResult = {};
    this.createContentView = jasmine.createSpy('createContentView').and.returnValue(this.createContentViewResult);
    this.model = new ModalViewModel({
      createContentView: this.createContentView
    });
  });

  it('should allow show/hide modal', function () {
    expect(this.model.get('show')).toBe(true);
    expect(this.model.isHidden()).toBe(false);

    this.model.hide();
    expect(this.model.get('show')).toBe(false);
    expect(this.model.isHidden()).toBe(true);

    this.model.show();
    expect(this.model.get('show')).toBe(true);
    expect(this.model.isHidden()).toBe(false);
  });

  describe('.createContentView', function () {
    beforeEach(function () {
      this.view = this.model.createContentView();
    });

    it('should create content view given viewModel', function () {
      expect(this.createContentView).toHaveBeenCalled();
      expect(this.createContentView).toHaveBeenCalledWith(this.model);
    });

    it('should return created view', function () {
      expect(this.view).toBe(this.createContentViewResult);
    });
  });
});
