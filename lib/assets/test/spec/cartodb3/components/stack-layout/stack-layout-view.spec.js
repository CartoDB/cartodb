var cdb = require('cartodb.js');
var StackLayoutView = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-view');
var StackLayoutModel = require('../../../../../javascripts/cartodb3/components/stack-layout/stack-layout-model');
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
      createStackView: function (stackLayoutModel) {
        return new SubView1({
          nextStackItem: stackLayoutModel.nextStep
        });
      }
    });

    var model2 = new cdb.core.Model({
      createStackView: function (stackLayoutModel, whatever) {
        return new SubView2({
          prevStackItem: stackLayoutModel.prevStep
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

  describe('onChangePosition', function() {

    it('should listen a change position from the view model', function () {
      var args = this.viewModel.bind.calls.argsFor(0);
      expect(args[0]).toEqual('change:position');
    });

    it('should remove previous view when there is a position change', function () {
      spyOn(this.view, '_removeOldStackView').and.callThrough();
      var currentViewCid = this.view._getCurrentView().cid;
      this.viewModel.set('position', 1);
      expect(this.view._removeOldStackView).toHaveBeenCalled();
      expect(currentViewCid).not.toBe(this.view._getCurrentView().cid);
    });

    it('should generate a new view when there is a position change', function () {
      spyOn(this.view, '_genNewStackView').and.callThrough();
      this.viewModel.set('position', 1);
      expect(this.view._genNewStackView).toHaveBeenCalled();
      expect(this.view._getCurrentView()).not.toBeUndefined();
    });

    it('should pass all arguments to the new view', function () {
      spyOn(this.view, '_genNewStackView').and.callThrough();
      this.viewModel.trigger('change:position', ['hello']);
      expect(this.view._genNewStackView).toHaveBeenCalledWith(['hello']);
    });
  });
});
