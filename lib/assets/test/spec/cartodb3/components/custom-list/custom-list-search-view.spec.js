var Backbone = require('backbone');
var CustomListSearchView = require('../../../../../javascripts/cartodb3/components/custom-list/custom-list-search-view');

describe('components/custom-list/custom-list-search-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({ visible: true, query: '' });

    this.view = new CustomListSearchView({
      model: this.model,
      typeLabel: 'column'
    });

    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('input[type="text"]').length).toBe(1);
    expect(this.view.$('button[type="button"]').length).toBe(1);
  });

  describe('.binds', function () {
    it('should submit form on key pressed in the text input', function () {
      spyOn(this.view, '_submit');
      this.view.$('input').trigger('keyup');
      expect(this.view._submit).toHaveBeenCalled();
    });

    it('should check buttons when query changes', function () {
      this.model.set('query', '');
      this.model.set('query', 'h');
    });

    it('should remove query when clear is pressed', function () {
      var $button = this.view.$('button[type="button"]');
      spyOn(this.view, 'focus');
      this.model.set('query', 'h');
      $button.click();
      expect(this.model.get('query')).toBe('');
      expect(this.view.focus).toHaveBeenCalled();
    });
  });
});
