var $ = require('jquery');
var Backbone = require('backbone');
require('backbone-forms');
Backbone.$ = $;
require('../../../../../../javascripts/cartodb3/components/form-components/editors/base.js');
require('../../../../../../javascripts/cartodb3/components/form-components/editors/select/select-view.js');

describe('components/form-components/editors/select', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      names: 'pepe'
    });

    this.view = new Backbone.Form.editors.Select({
      key: 'names',
      schema: {
        options: ['pepe', 'paco', 'juan']
      },
      model: this.model
    });
    this.view.render();
    this.listView = this.view._listView;
  });

  it('should genereate an options collection', function () {
    expect(this.view.collection).toBeDefined();
    expect(this.view.collection.size()).toBe(3);
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text()).toContain('pepe');
    });

    it('should disable the component if option is true', function () {
      this.view.options.disabled = true;
      spyOn(this.view, 'undelegateEvents').and.callThrough();
      this.view._initViews();
      expect(this.view.$('.js-button').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.undelegateEvents).toHaveBeenCalled();
    });

    it('should add is-empty class if there is no value selected', function () {
      this.model.set('names', '');
      this.view._initViews();
      expect(this.view.$('.js-button').hasClass('is-empty')).toBeTruthy();
    });
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

  function dispatchDocumentEvent (type, opts) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, false, true);
    if (opts.which) {
      e.which = opts.which;
    }
    document.dispatchEvent(e, opts);
  }
});
