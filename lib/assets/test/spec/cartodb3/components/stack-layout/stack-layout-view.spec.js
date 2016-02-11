var cdb = require('cartodb.js');
var StackLayoutView = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-view');
var _ = require('underscore');
var Backbone = require('backbone');

describe('stack-layout/view', function () {
  beforeEach(function () {
    var SubView1 = cdb.core.View.extend({
      events: {
        'click': '_onClickNext'
      },
      _onClickNext: function () {
        this.options.nextStackItem('hello');
      }
    });

    var SubView2 = cdb.core.View.extend({
      events: {
        'click': '_onClickPrev'
      },
      _onClickPrev: function () {
        this.options.prevStackItem('welcome');
      }
    });

    var model1 = new cdb.core.Model({
      createStackView: function (gotoNextStack) {
        return new SubView1({
          nextStackItem: gotoNextStack
        });
      }
    });

    var model2 = new cdb.core.Model({
      createStackView: function (gotoNextStack, gotoPrevStack, whatever) {
        return new SubView2({
          nextStackItem: gotoNextStack,
          prevStackItem: gotoPrevStack
        });
      }
    });

    this.collection = new Backbone.Collection([model1, model2]);
    this.view = new StackLayoutView({
      collection: this.collection
    });
    this.view.render();

    this.viewModel = this.view.model;
    spyOn(this.view, '_removeOldStackView').and.callThrough();
    spyOn(this.view, '_genNewStackViewByPos').and.callThrough();
  });

  it('should render the layout', function () {
    expect(this.view.$('.js-current').length).toBe(1);
    expect(this.view.$('.js-prev').length).toBe(1);
    expect(this.view.$('.js-next').length).toBe(1);
  });

  it('should generate a view from the beginning', function () {
    expect(this.view.model.get('currentView')).not.toBeUndefined();
  });

  describe('next step', function () {
    beforeEach(function () {
      this.currentView = this.view.model.get('currentView');
      this.currentView.$el.click();
    });

    it('should change current view', function () {
      var nextView = this.viewModel.get('currentView');
      expect(this.currentView.cid).not.toBe(nextView.cid);
    });

    it('should update current position', function () {
      expect(this.viewModel.get('position')).toBe(1);
    });

    it("shouldn't have more than one subview", function () {
      expect(this.view._removeOldStackView).toHaveBeenCalled();
      expect(_.size(this.view._subviews)).toBe(1);
    });

    it("shouldn't change to a non existant position", function () {
      this.viewModel.set('position', 1);
      expect(this.view._nextStep).toThrowError();
    });
  });

  describe('prev step', function () {
    beforeEach(function () {
      this.view.model.get('currentView').$el.click(); // Move to next
      this.currentView = this.view.model.get('currentView');
      this.currentView.$el.click(); // Back to prev
    });

    it('should change current view', function () {
      var nextView = this.viewModel.get('currentView');
      expect(this.currentView.cid).not.toBe(nextView.cid);
    });

    it('should update current position', function () {
      expect(this.viewModel.get('position')).toBe(0);
    });

    it("shouldn't have more than one subview", function () {
      expect(this.view._removeOldStackView).toHaveBeenCalled();
      expect(_.size(this.view._subviews)).toBe(1);
    });

    it("shouldn't change to a non existant position", function () {
      this.viewModel.set('position', 0);
      expect(this.view._prevStep).toThrowError();
    });
  });
});
