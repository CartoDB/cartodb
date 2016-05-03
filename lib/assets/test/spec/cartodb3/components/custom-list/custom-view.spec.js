var CustomView = require('../../../../../javascripts/cartodb3/components/custom-list/custom-view');

describe('components/custom-list/custom-view', function () {
  beforeEach(function () {
    this.view = new CustomView({
      options: [
        {
          val: 'hello'
        }, {
          val: 'hi'
        }, {
          val: 'howdy'
        }
      ]
    });
  });

  it('should generate internal collection and model', function () {
    expect(this.view.model).toBeDefined();
    expect(this.view.collection).toBeDefined();
  });

  describe('render', function () {
    beforeEach(function () {
      spyOn(this.view, '_renderSearch');
      spyOn(this.view, '_renderList');
      this.view.render();
    });

    it('should render list and search view by default', function () {
      expect(this.view._renderList).toHaveBeenCalled();
      expect(this.view._renderSearch).toHaveBeenCalled();
    });

    it('should not render search view if showSearch is disabled', function () {
      expect(this.view._renderSearch.calls.count()).toBe(1);
      expect(this.view._renderList.calls.count()).toBe(1);
      this.view.options.showSearch = false;
      this.view.render();
      expect(this.view._renderSearch.calls.count()).toBe(1);
      expect(this.view._renderList.calls.count()).toBe(2);
    });
  });

  describe('on change visibility', function () {
    beforeEach(function () {
      spyOn(this.view, '_toggleVisibility');
      spyOn(this.view, 'clearSubViews');
      spyOn(this.view, 'render');

      this.view.model.set({
        visible: true,
        query: 'hello'
      });
    });

    it('should reset query attribute, toggle the visibility and render', function () {
      expect(this.view._toggleVisibility).toHaveBeenCalled();
      expect(this.view.model.get('query')).toBe('');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should clear subviews when visibility changes to false', function () {
      this.view.model.set({
        visible: false
      });

      expect(this.view.clearSubViews).toHaveBeenCalled();
      expect(this.view.render).not.toHaveBeenCalled();
    });
  });

});
