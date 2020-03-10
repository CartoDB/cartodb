var DeleteLayerView = require('../../../../../../javascripts/cartodb/common/dialogs/delete_layer/delete_layer_view');

describe('common/dialogs/delete_layer/delete_layer_view', function() {
  beforeEach(function() {
    this.layer = new cdb.admin.CartoDBLayer({
    });

    spyOn(this.layer, 'destroy');

    this.view = new DeleteLayerView({
      model: this.layer
    });
    this.view.render();
  });

  it('should render the confirm view first', function() {
    expect(this.innerHTML()).toContain('ok');
  });

  describe('when click ok to delete layer', function() {
    beforeEach(function() {
      this.view.$('.ok').trigger('click');
    });

    it('should change to the loading view', function() {
      expect(this.innerHTML()).not.toContain('ok');
      expect(this.innerHTML()).toContain('Deleting layer');
    });

    it('should call to destroy the model', function() {
      expect(this.layer.destroy).toHaveBeenCalled();
    });

    it('should not remove layer from owning collection until after confirmed deleted', function() {
      expect(this.layer.destroy.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ wait: true }));
    });

    describe('when successfully deleted', function() {
      beforeEach(function() {
        spyOn(this.view, 'close');
        this.layer.destroy.calls.argsFor(0)[0].success();
      });

      it('should close this view', function(done) {
        var self = this;
        setTimeout(function() {
          expect(self.view.close).toHaveBeenCalled();
          done();
        }, 0);
      });
    });

    describe('when fails to delete layer', function() {
      beforeEach(function() {
        this.layer.destroy.calls.argsFor(0)[0].error();
      });

      it('should show the fail view', function() {
        expect(this.innerHTML()).toContain('Could not delete layer');
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
