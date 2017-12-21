var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var MergeDatasetsView = require('../../../../../../javascripts/cartodb/common/dialogs/merge_datasets/merge_datasets_view');

describe('common/dialog/merge_datasets/merge_datasets_view', function() {
  beforeEach(function() {
    this.table = TestUtil.createTable('a');
    this.user = new cdb.admin.User({
      base_url: 'http://pepe.carto.com'
    });
    this.view = new MergeDatasetsView({
      table: this.table,
      user: this.user
    });
    this.view.render();
  });

  it('should display start view', function() {
    expect(this.innerHTML()).toContain('js-flavors');
    expect(this.innerHTML()).not.toContain('js-details');
  });

  describe('when a column merge is clicked', function() {
    beforeEach(function() {
      this.firstFlavor = this.view.model.get('mergeFlavors').at(0);
      spyOn(this.firstFlavor, 'firstStep').and.callThrough();
      $(this.view.$('.OptionCard')[0]).click();
    });

    it('should render the next view', function() {
      expect(this.firstFlavor.firstStep).toHaveBeenCalled();
      expect(this.innerHTML()).not.toContain('js-flavors');
      expect(this.innerHTML()).toContain('js-details');
    });

    describe('when click back', function() {
      beforeEach(function() {
        this.view.$('.js-back').click();
      });

      it('should display start view again', function() {
        expect(this.innerHTML()).toContain('js-flavors');
        expect(this.innerHTML()).not.toContain('js-details');
      });
    });

    describe('when current step triggers a gotoNextStep', function() {
      beforeEach(function() {
        spyOn(this.view.model, 'gotoNextStep');
        this.view.model.get('currentStep').set('gotoNextStep', true);
      });

      it('should tell merge model go to next step', function() {
        expect(this.view.model.gotoNextStep).toHaveBeenCalled();
      });
    });

    describe('when change current step', function() {
      beforeEach(function() {
        var fakeView = new cdb.core.View();
        fakeView.render = function() {
          this.$el.html('new step');
          return this;
        };
        this.newStep = new cdb.core.Model({});
        this.newStep.createView = jasmine.createSpy('createView').and.returnValue(fakeView);

        this.prevStep = this.view.model.get('currentStep');
        spyOn(this.prevStep, 'unbind').and.callThrough();

        this.view.model.set('currentStep', this.newStep);
      });

      it('should render the new view', function() {
        expect(this.innerHTML()).toContain('<div>new step</div>');
      });

      it('should create a new view based on new step', function() {
        expect(this.newStep.createView).toHaveBeenCalled();
      });

      it('should clean up old model', function() {
        expect(this.prevStep.unbind).toHaveBeenCalled();
      });

      it('should not have leaks', function() {
        expect(this.view).toHaveNoLeaks();
      });
    });

    describe('when change current step and new step has skipDefaultTemplate set to true', function() {
      beforeEach(function() {
        var fakeView = new cdb.core.View();
        fakeView.render = function() {
          this.$el.html('new step');
          return this;
        };
        this.newStep = new cdb.core.Model({
          skipDefaultTemplate: true
        });
        this.newStep.createView = jasmine.createSpy('createView').and.returnValue(fakeView);
        this.view.model.set('currentStep', this.newStep);
      });

      it('should replace dialog content completely with new step content', function() {
        expect(this.view.$('.content').html()).toEqual('<div>new step</div>');
      });
    });
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
