var cdb = require('cartodb.js');
var LoadingView = require('../../../../../javascripts/cartodb3/components/loading/loading-view');

describe('components/loading/loading-view', function () {
  beforeEach(function () {
    this.createContentViewSpy = jasmine.createSpy('createContentView');
    this.view = new LoadingView({
      title: 'happy-case test',
      predicate: function () {
        return false;
      },
      createContentView: this.createContentViewSpy
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the loading text', function () {
    expect(this.view.$el.html()).toContain('happy-case test');
  });

  describe('when predicate pass', function () {
    beforeEach(function () {
      this.createContentViewSpy.and.callFake(function (opts) {
        var contentView = new cdb.core.View(opts);
        contentView.render = function () {
          this.$el.html('**content**');
          return this;
        };
        return contentView;
      });
      this.view.model.set('predicate', function () {
        return true;
      });
    });

    it('should render content view instead', function () {
      expect(this.view.$el.html()).toContain('**content**');
      expect(this.view.$el.html()).not.toContain('happy-case test');
    });
  });
});
