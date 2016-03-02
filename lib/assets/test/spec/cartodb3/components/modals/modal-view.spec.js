var cdb = require('cartodb.js');
var ModalViewModel = require('../../../../../javascripts/cartodb3/components/modals/modal-view-model');
var ModalView = require('../../../../../javascripts/cartodb3/components/modals/modal-view');

describe('components/modals/modal-view', function () {
  var contentView;

  beforeEach(function () {
    contentView = new cdb.core.View();
    spyOn(contentView, 'render').and.callThrough();
    this.model = new ModalViewModel({
      createContentView: function () { return contentView; }
    });
    this.view = new ModalView({
      model: this.model
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render dialog classes', function () {
    expect(this.view.$el.html()).toContain('Dialog');
    expect(this.view.$el.html()).toContain('Dialog-contentWrapper');
  });

  describe('when close is clicked', function () {
    beforeEach(function () {
      jasmine.clock().install();
      spyOn(this.view, 'hide').and.callThrough();
      spyOn(this.view, 'clean').and.callThrough();
      spyOn(this.model, 'destroy').and.callThrough();
      this.view.$('.js-close').click();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should destroy the model', function () {
      expect(this.model.destroy).toHaveBeenCalled();
    });

    it('should hide modal', function () {
      expect(this.view.hide).toHaveBeenCalled();
    });

    it('should have cleaned the view', function () {
      expect(this.view.clean).not.toHaveBeenCalled();
    });

    describe('when the close animation is done', function () {
      beforeEach(function () {
        jasmine.clock().tick(1000);
      });

      it('should have cleaned the view', function () {
        expect(this.view.clean).toHaveBeenCalled();
      });
    });
  });
});
