var cdb = require('cartodb.js');
var ModalsServiceModel = require('../../../../../javascripts/cartodb3/components/modals/modals-service-model');

describe('components/modals/modals-service-model', function () {
  beforeEach(function () {
    this.modals = new ModalsServiceModel();
    this.willCreateModalSpy = jasmine.createSpy('willCreateModal');
    this.didCreateModalSpy = jasmine.createSpy('didCreateModal');
    this.modals.on('willCreateModal', this.willCreateModalSpy);
    this.modals.on('didCreateModal', this.didCreateModalSpy);
  });

  describe('.create', function () {
    var contentView, contentView2;

    beforeEach(function () {
      spyOn(document.body, 'appendChild');

      contentView = new cdb.core.View();
      spyOn(contentView, 'render').and.callThrough();

      this.modalView = this.modals.create(function () {
        return contentView;
      });
    });

    it('should return a modal view', function () {
      expect(this.modalView).toBeDefined();
    });

    it('should trigger a willCreateModal event', function () {
      expect(this.willCreateModalSpy).toHaveBeenCalled();
    });

    it('should trigger a didCreateModal event', function () {
      expect(this.didCreateModalSpy).toHaveBeenCalled();
    });

    it('should render the content view', function () {
      expect(contentView.render).toHaveBeenCalled();
    });

    it('should append the modal to the body', function () {
      expect(document.body.appendChild).toHaveBeenCalledWith(this.modalView.el);
    });

    describe('sequent calls should remove any existing modal', function () {
      beforeEach(function () {
        spyOn(this.modalView, 'destroy').and.callThrough();

        contentView2 = new cdb.core.View();
        spyOn(contentView2, 'render').and.callThrough();

        this.modalView2 = this.modals.create(function () {
          return contentView2;
        });
      });

      it('should destroy the prev modal', function () {
        expect(this.modalView.destroy).toHaveBeenCalled();
      });

      it('should append the new modal to the body', function () {
        expect(document.body.appendChild).toHaveBeenCalledWith(this.modalView2.el);
      });
    });
  });
});
