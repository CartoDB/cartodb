var $ = require('jquery');
var Backbone = require('backbone');
var dispatchDocumentEvent = function (type, opts) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(type, false, true);
  if (opts.which) {
    e.which = opts.which;
  }
  document.dispatchEvent(e, opts);
};

describe('components/form-components/editors/suggest', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'carlos'
    });

    this.view = new Backbone.Form.editors.Suggest({
      key: 'names',
      schema: {
        options: []
      },
      model: this.model,
      editorAttrs: {
        showSearch: true,
        allowFreeTextInput: true,
        collectionData: ['pepe', 'paco', 'juan']
      }
    });
    this.view.render();
    this.listView = this.view._listView;
  });

  describe('when there are values not null', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('carlos');
    });

    it('should disable the component if option is true', function () {
      this.view.options.disabled = true;
      this.view.render();
      expect(this.view.$('.js-button').hasClass('is-disabled')).toBeTruthy();
    });

    it('should add is-empty class if null value is selected', function () {
      this.model.set('names', '');
      this.view.collection.removeSelected();
      this.view.render();
      expect(this.view.$('.js-button').hasClass('is-empty')).toBeTruthy();
    });
  });

  describe('when all column row values are null but selected value is not null', function () {
    // ColumnRowData only fetches 40 rows

    beforeEach(function () {
      this.model = new Backbone.Model({
        names: 'carlos'
      });

      this.view = new Backbone.Form.editors.Suggest({
        key: 'names',
        schema: {
          options: []
        },
        model: this.model,
        editorAttrs: {
          showSearch: true,
          allowFreeTextInput: true,
          collectionData: [null, null, null]
        }
      });
      this.view.render();
      this.listView = this.view._listView;
    });

    it('should render properly', function () {
      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('carlos');
    });

    it('should add is-empty class if null value is selected', function () {
      this.model.set('names', '');
      this.view.collection.removeSelected();
      this.view.render();
      expect(this.view.$('.js-button').hasClass('is-empty')).toBeTruthy();
    });
  });

  describe('when all column row values are null', function () {
    // TODO: replace Text editor
  });

  describe('bindings', function () {
    beforeEach(function () {
      spyOn(this.listView, 'hide');
    });

    it('should close list view if ESC is pressed', function () {
      dispatchDocumentEvent('keydown', { which: 27 });
      expect(this.listView.hide).toHaveBeenCalled();
    });

    it('should close list view if user clicks out the select', function () {
      dispatchDocumentEvent('click', { target: 'body' });
      expect(this.listView.hide).toHaveBeenCalled();
    });
  });

  describe('on ENTER pressed', function () {
    beforeEach(function () {
      spyOn(this.listView, 'toggle');
      this._event = $.Event('keydown');
      this._event.which = 13;
    });

    it('should open custom list', function () {
      this.view.$('.js-button').trigger(this._event);
      expect(this.listView.toggle).toHaveBeenCalled();
    });

    it('should not open custom list if it is already visible', function () {
      this.listView.show();
      this.view.$('.js-button').trigger(this._event);
      expect(this.listView.toggle).not.toHaveBeenCalled();
    });
  });

  it('should change button value and hide list when a new item is selected', function () {
    spyOn(this.listView, 'hide');
    var mdl = this.view.collection.where({ val: 'juan' });
    mdl[0].set('selected', true);
    expect(this.view.$('.js-button').text()).toContain('juan');
    expect(this.view.$('.js-button').hasClass('is-empty')).toBeFalsy();
    expect(this.listView.hide).toHaveBeenCalled();
  });

  it('should open list view if "button" is clicked', function () {
    spyOn(this.listView, 'toggle');
    this.view.$('.js-button').trigger('click');
    expect(this.listView.toggle).toHaveBeenCalled();
  });

  it('should destroy custom list when element is removed', function () {
    spyOn(this.view._listView, 'clean');
    this.view.remove();
    expect(this.view._listView.clean).toHaveBeenCalled();
  });

  afterEach(function () {
    this.view.remove();
  });
});
