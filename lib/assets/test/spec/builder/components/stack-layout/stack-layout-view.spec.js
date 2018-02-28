var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('builder/components/stack-layout/stack-layout-view');
var StackLayoutModel = require('builder/components/stack-layout/stack-layout-model');

describe('stack-layout/view', function () {
  beforeEach(function () {
    var SubView1 = CoreView.extend({
      events: {
        'click': '_onClickNext'
      },
      _onClickNext: function () {
        this.options.stackLayoutModel.nextStep('hello');
      }
    });

    var SubView2 = CoreView.extend({
      events: {
        'click': '_onClickPrev'
      },
      _onClickPrev: function () {
        this.options.stackLayoutModel.prevStep('welcome');
      }
    });

    var model1 = new Backbone.Model({
      createStackView: function (stackLayoutModel) {
        return new SubView1({
          stackLayoutModel: stackLayoutModel
        });
      }
    });

    var model2 = new Backbone.Model({
      createStackView: function (stackLayoutModel, whatever) {
        return new SubView2({
          stackLayoutModel: stackLayoutModel
        });
      }
    });

    spyOn(StackLayoutModel.prototype, 'bind').and.callThrough();
    this.collection = new Backbone.Collection([model1, model2]);
    this.view = new StackLayoutView({
      collection: this.collection
    });
    this.view.render();
    this.viewModel = this.view.model;
  });

  it('should render the layout', function () {
    expect(this.view.$el.html()).not.toBe('');
  });

  it('should generate a view from the beginning', function () {
    expect(this.view._getCurrentView()).not.toBeUndefined();
  });

  describe('onChangePosition', function () {
    it('should listen a change position from the view model', function () {
      var args = this.viewModel.bind.calls.argsFor(0);
      expect(args[0]).toEqual('positionChanged');
    });

    it('should remove previous view when there is a position change', function () {
      spyOn(this.view, '_removeOldStackView').and.callThrough();
      var currentViewCid = this.view._getCurrentView().cid;
      this.viewModel.nextStep();
      expect(this.view._removeOldStackView).toHaveBeenCalled();
      expect(currentViewCid).not.toBe(this.view._getCurrentView().cid);
    });

    it('should generate a new view when there is a position change', function () {
      spyOn(this.view, '_genNewStackView').and.callThrough();
      this.viewModel.nextStep();
      expect(this.view._genNewStackView).toHaveBeenCalled();
      expect(this.view._getCurrentView()).not.toBeUndefined();
    });

    it('should pass all arguments to the new view', function () {
      spyOn(this.view, '_genNewStackView').and.callThrough();
      this.viewModel.nextStep('hello');
      expect(this.view._genNewStackView).toHaveBeenCalledWith(['hello']);
    });
  });
});
