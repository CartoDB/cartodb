var CustomView = require('../../../../../javascripts/cartodb3/components/custom-list/custom-view');

describe('components/custom-list/custom-view', function () {
  beforeEach(function () {
    this.searchPlaceholderText = 'a search placeholder';
    this.view = new CustomView({
      searchPlaceholder: this.searchPlaceholderText,
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
      spyOn(this.view, '_renderHeader').and.callThrough();
      spyOn(this.view, '_renderSearch').and.callThrough();
      spyOn(this.view, '_renderActions').and.callThrough();
      spyOn(this.view, '_renderList');
      this.view.render();
    });

    it('should render list and search view by default', function () {
      expect(this.view._renderHeader).toHaveBeenCalled();
      expect(this.view._renderSearch).toHaveBeenCalled();
      expect(this.view._renderList).toHaveBeenCalled();
      expect(this.view._renderActions).not.toHaveBeenCalled();
      expect(this.view._searchView.options.searchPlaceholder).toEqual(this.searchPlaceholderText);
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

  describe('with actions', function () {
    beforeEach(function () {
      this.actions = [
        { label: 'All', action: function () {} },
        { label: 'None', action: function () {} }
      ];
      this.viewWithActions = new CustomView({
        searchPlaceholder: this.searchPlaceholderText,
        options: [
          { val: 'hello' },
          { val: 'hi' },
          { val: 'howdy' }
        ],
        actions: this.actions
      });
      spyOn(this.viewWithActions, '_renderActions').and.callThrough();
      spyOn(this.actions[0], 'action');
      spyOn(this.actions[1], 'action');
      this.viewWithActions.render();
    });

    it('should render the actions', function () {
      expect(this.viewWithActions._renderActions).toHaveBeenCalled();
    });

    it('should call the provided action', function () {
      expect(this.actions[0].action).not.toHaveBeenCalled();
      expect(this.actions[1].action).not.toHaveBeenCalled();
      this.viewWithActions.$('.js-header button').each(function (i, button) {
        button.click();
      });
      expect(this.actions[0].action).toHaveBeenCalled();
      expect(this.actions[1].action).toHaveBeenCalled();
    });

    it('should hide the actions if there is a search query', function () {
      this.viewWithActions.model.set('query', 'rick');
      expect(this.viewWithActions.$('.js-actions').hasClass('u-hide')).toBe(true);
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
      this.view.render.calls.reset();

      this.view.model.set({
        visible: false
      });

      expect(this.view.clearSubViews).toHaveBeenCalled();
      expect(this.view.render).not.toHaveBeenCalled();
    });
  });
});
