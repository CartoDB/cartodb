var CoreView = require('backbone/core-view');
var OnboardingsServiceModel = require('builder/components/onboardings/onboardings-service-model');

describe('components/onboardings/onboardings-service-model', function () {
  beforeEach(function () {
    this.onboardings = new OnboardingsServiceModel();
    this.willCreateOnboardingSpy = jasmine.createSpy('willCreateOnboarding');
    this.didCreateOnboardingSpy = jasmine.createSpy('didCreateOnboarding');
    this.onboardings.on('willCreateOnboarding', this.willCreateOnboardingSpy);
    this.onboardings.on('didCreateOnboarding', this.didCreateOnboardingSpy);
  });

  describe('.create', function () {
    var contentView, contentView2;

    beforeEach(function () {
      spyOn(document.body, 'appendChild');

      contentView = new CoreView();
      spyOn(contentView, 'render').and.callThrough();

      this.modalView = this.onboardings.create(function () {
        return contentView;
      });
    });

    it('should return a modal view', function () {
      expect(this.modalView).toBeDefined();
    });

    it('should trigger a willCreateOnboarding event', function () {
      expect(this.willCreateOnboardingSpy).toHaveBeenCalled();
    });

    it('should trigger a didCreateOnboarding event', function () {
      expect(this.didCreateOnboardingSpy).toHaveBeenCalled();
    });

    it('should render the content view', function () {
      expect(contentView.render).toHaveBeenCalled();
    });

    it('should append the modal to the body', function () {
      expect(document.body.appendChild).toHaveBeenCalledWith(this.modalView.el);
    });

    it('should add the special body class', function () {
      expect(document.body.className).toContain('is-inDialog');
    });

    describe('subsequent calls', function () {
      beforeEach(function () {
        contentView2 = new CoreView();
        spyOn(contentView2, 'render').and.callThrough();

        this.modalView2 = this.onboardings.create(function () {
          return contentView2;
        });
      });

      it('should reuse modal view', function () {
        expect(this.modalView2).toBe(this.modalView);
      });

      it('should append the new modal to the body', function () {
        expect(document.body.appendChild).toHaveBeenCalledWith(this.modalView2.el);
      });

      it('should keep the special body class', function () {
        expect(document.body.className).toContain('is-inDialog');
      });

      describe('when destroyed', function () {
        beforeEach(function () {
          jasmine.clock().install();
          this.destroyOnceSpy = jasmine.createSpy('destroyedOnboarding');
          this.onboardings.onDestroyOnce(this.destroyOnceSpy);
          spyOn(this.modalView2, 'clean').and.callThrough();
          this.modalView2.destroy();
        });

        afterEach(function () {
          jasmine.clock().uninstall();
        });

        it('should not clean the view right away but wait until after animation', function () {
          expect(this.modalView2.clean).not.toHaveBeenCalled();
        });

        it('should have closing animation', function () {
          expect(this.modalView2.el.className).toContain('is-closing');
          expect(this.modalView2.el.className).not.toContain('is-opening');
        });

        it('should remove the special body class', function () {
          expect(document.body.className).not.toContain('is-inDialog');
        });

        describe('when close animation is done', function () {
          beforeEach(function () {
            jasmine.clock().tick(250);
          });

          it('should have cleaned the view', function () {
            expect(this.modalView2.clean).toHaveBeenCalled();
          });

          it('should have triggered listener', function () {
            expect(this.destroyOnceSpy).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
