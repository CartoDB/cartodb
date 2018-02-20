var Backbone = require('backbone');
var _ = require('underscore');
var CustomListSearchView = require('builder/components/custom-list/custom-list-search-view');

describe('components/custom-list/custom-list-search-view', function () {
  var createViewFn = function (options) {
    this.model = new Backbone.Model({ visible: true, query: '' });
    var defaultOptions = {
      model: this.model,
      typeLabel: 'column'
    };

    spyOn(CustomListSearchView.prototype, '_checkButtons').and.callThrough();
    this.view = new CustomListSearchView(_.extend(defaultOptions, options));

    this.view.render();
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  describe('render', function () {
    it('should render properly', function () {
      this.createView();

      expect(this.view.$('input[type="text"]').length).toBe(1);
      expect(this.view.$('button[type="button"]').length).toBe(1);
      expect(this.view.$('input').attr('placeholder')).toEqual('components.custom-list.placeholder');
    });

    it('should render custom placeholder if provided', function () {
      var customSearchPlaceholder = 'search by column';
      this.createView({
        searchPlaceholder: customSearchPlaceholder
      });

      expect(this.view.$('input').attr('placeholder')).toEqual(customSearchPlaceholder);
    });
  });

  describe('.binds', function () {
    beforeEach(function () {
      this.createView();
    });

    it('should submit form on key pressed in the text input', function () {
      spyOn(this.view, '_submit');
      this.view.$('input').trigger('keyup');
      expect(this.view._submit).toHaveBeenCalled();
    });

    it('should check buttons when query changes', function () {
      var $button = this.view.$('button[type="button"]');
      expect($button.hasClass('u-transparent')).toBe(true);
      this.model.set('query', 'h');
      expect(this.view._checkButtons).toHaveBeenCalled();
      expect($button.hasClass('u-transparent')).toBe(false);
    });

    it('should remove query when clear is pressed', function () {
      spyOn(this.view, 'focus');
      var $button = this.view.$('button[type="button"]');
      this.model.set('query', 'h');
      $button.click();
      expect(this.model.get('query')).toBe('');
      expect(this.view.focus).toHaveBeenCalled();
    });
  });
});
