var cdb = require('cartodb-deep-insights.js');
var $ = require('jquery');
var LikesView = require('../../../../../javascripts/cartodb3/components/likes/likes-view');
var LikesModel = require('../../../../../javascripts/cartodb3/components/likes/likes-model');

describe('components/likes/likes-view', function () {
  beforeEach(function () {
    this.model = new LikesModel({
      liked: false,
      likes: 41,
      vis_id: 'hello'
    }, {
      configModel: 'c'
    });

    this.view = new LikesView({
      model: this.model
    });

    this.view.render();
    this.html = function () {
      return $('<div>').append(this.view.$el.clone()).remove().html();
    };
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the likes count', function () {
    expect(this.html()).toContain('41');
  });

  it('should not rendered the liked state since not liked yet', function () {
    expect(this.html()).not.toContain('is-liked');
  });

  it('should not animated view since no state change yet', function () {
    expect(this.html()).not.toContain('is-animated');
  });

  describe('click toggle', function () {
    beforeEach(function () {
      (function (_this) {
        spyOn(_this.model, 'toggleLiked').and.callFake(function () {
          _this.model.set({ liked: true, likes: 42 });
        });
      })(this);
      spyOn(this.view, 'killEvent');
      spyOn(this.view.$el, 'one');
      this.view.$el.click();
    });

    it('should prevent event default', function () {
      expect(this.view.killEvent).toHaveBeenCalledWith(jasmine.any(Object));
    });

    it('should have toggled liked state on model', function () {
      expect(this.model.toggleLiked).toHaveBeenCalled();
    });

    it('should render the new likes count', function () {
      expect(this.html()).toContain('42');
    });

    it('should render animate next render', function () {
      expect(this.html()).toContain('is-animated');
    });

    it('should remove animation once done animating', function () {
      // Manually trigger the on-animation-end callback to simulate that animation finished
      this.view.$el.one.calls.argsFor(0)[1]();

      expect(this.html()).not.toContain('is-animated');
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
