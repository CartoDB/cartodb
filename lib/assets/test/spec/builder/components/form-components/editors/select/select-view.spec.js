var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var CustomListCollection = require('builder/components/custom-list/custom-list-collection');

describe('components/form-components/editors/select', function () {
  var view;
  var mouseOverAction;
  var mouseOutAction;

  var dispatchDocumentEvent = function (type, opts) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, false, true);
    if (opts.which) {
      e.which = opts.which;
    }
    document.dispatchEvent(e, opts);
  };

  mouseOverAction = jasmine.createSpy('mouseOverAction');
  mouseOutAction = jasmine.createSpy('mouseOutAction');

  var createViewFn = function (options) {
    var model = new Backbone.Model({
      names: 'pepe',
      latitude: undefined
    });

    var defaultOptions = {
      key: 'names',
      schema: {
        options: ['pepe', 'paco', 'juan']
      },
      model: model,
      mouseOverAction: mouseOverAction,
      mouseOutAction: mouseOutAction
    };

    view = new Backbone.Form.editors.Select(_.extend(defaultOptions, options));

    view.render();

    return view;
  };

  beforeEach(function () {
    this.createView = createViewFn.bind(this);
  });

  afterEach(function () {
    view && view.remove();
  });

  it('should genereate an options collection', function () {
    view = this.createView();

    expect(view.collection).toBeDefined();
    expect(view.collection.size()).toBe(3);
  });

  describe('render', function () {
    it('should render properly', function () {
      view = this.createView();

      expect(view.$('.js-button').length).toBe(1);
      expect(view.$('.js-button').text()).toContain('pepe');
    });

    it('should render custom placeholder if provided', function () {
      view = this.createView({
        placeholder: 'quinoa',
        keyAttr: 'latitude'
      });

      expect(view.$('.js-button').length).toBe(1);
      expect(view.$('.js-button').text()).toContain('quinoa');
    });

    it('should pass searchPlaceholder to CustomListView if present', function () {
      var text = 'Search Machine';
      view = this.createView({
        searchPlaceholder: text
      });

      expect(view._listView.options.searchPlaceholder).toEqual(text);
    });

    it('should disable the component if option is true', function () {
      view = this.createView();

      view.options.disabled = true;
      view.render();
      expect(view.$('.js-button').hasClass('is-disabled')).toBeTruthy();
    });

    it('should add is-empty class if there is no value selected', function () {
      view = this.createView();

      view.model.set({names: ''});
      view.setValue('');

      expect(view.$('.js-button').hasClass('is-empty')).toBeTruthy();
    });
  });

  describe('bindings', function () {
    beforeEach(function () {
      view = this.createView();
      spyOn(view._listView, 'hide');
    });

    it('should close list view if ESC is pressed', function () {
      dispatchDocumentEvent('keydown', { which: 27 });
      expect(view._listView.hide).toHaveBeenCalled();
    });
  });

  describe('on ENTER pressed', function () {
    beforeEach(function () {
      view = this.createView();
      spyOn(view._listView, 'toggle');
      this._event = $.Event('keydown');
      this._event.which = 13;
    });

    it('should open custom list', function () {
      view.$('.js-button').trigger(this._event);
      expect(view._listView.toggle).toHaveBeenCalled();
    });

    it('should not open custom list if it is already visible', function () {
      view._listView.show();
      view.$('.js-button').trigger(this._event);
      expect(view._listView.toggle).not.toHaveBeenCalled();
    });
  });

  it('should change button value and hide list when a new item is selected', function () {
    view = this.createView();
    spyOn(view._listView, 'hide');
    var mdl = view.collection.where({ val: 'juan' });
    mdl[0].set('selected', true);
    expect(view.$('.js-button').text()).toContain('juan');
    expect(view.$('.js-button').hasClass('is-empty')).toBeFalsy();
    expect(view._listView.hide).toHaveBeenCalled();
  });

  it('should open list view if "button" is clicked', function () {
    view = this.createView();
    spyOn(view._listView, 'toggle');
    view.$('.js-button').trigger('click');
    expect(view._listView.toggle).toHaveBeenCalled();
  });

  it('should destroy custom list, and tooltip when element is removed', function () {
    view = this.createView();
    spyOn(view._listView, 'clean');
    spyOn(view, '_removeTooltip');

    view.remove();

    expect(view._listView.clean).toHaveBeenCalled();
    expect(view._removeTooltip).toHaveBeenCalled();
  });

  describe('placeholder', function () {
    it('empty and no value', function () {
      view = this.createView({
        keyAttr: 'latitude',
        schema: {
          options: []
        }
      });

      var placeholder = $.trim(view.$('.js-button').text());
      expect(placeholder).toBe('components.backbone-forms.select.empty');
    });

    it('disabled and no value', function () {
      view = this.createView({
        keyAttr: 'latitude',
        disabled: true
      });

      var placeholder = $.trim(view.$('.js-button').text());
      expect(placeholder).toBe('components.backbone-forms.select.disabled-placeholder');
    });

    it('no value', function () {
      view = this.createView({
        keyAttr: 'latitude'
      });

      var placeholder = $.trim(view.$('.js-button').text());
      expect(placeholder).toBe('components.backbone-forms.select.placeholder');
    });
  });

  describe('async collection', function () {
    beforeEach(function () {
      var collection = new CustomListCollection();
      collection.stateModel = new Backbone.Model({
        state: 'fetching'
      });

      collection.isAsync = function () { return true; };

      view = this.createView({
        schema: {
          collection: collection
        }
      });
    });

    it('should show loading if collection is fetching', function () {
      expect(view.$('.js-button .CDB-LoaderIcon').length).toBe(1);
    });

    it('should show list once collection is fetched', function () {
      view.collection.reset([{
        label: 'pepe',
        val: 'pepe'
      }, {
        label: 'paco',
        val: 'paco'
      }, {
        label: 'juan',
        val: 'juan'
      }]);

      view.collection.stateModel.set({
        state: 'fetched'
      });

      expect(view.$('.CustomList--inner').length).toBe(1);
      expect(view.$('.js-button').text()).toContain('pepe');
    });
  });

  describe('with help', function () {
    beforeEach(function () {
      view = this.createView({
        editorAttrs: {
          help: 'help'
        }
      });
    });

    describe('.render', function () {
      it('should render properly', function () {
        expect(view.$('.js-help').attr('data-tooltip')).toContain('help');
      });
    });

    describe('._removeTooltip', function () {
      it('should destroy tooltip', function () {
        spyOn(view._helpTooltip, 'clean');

        view._removeTooltip();

        expect(view._helpTooltip.clean).toHaveBeenCalled();
      });
    });
  });

  describe('mouseOverAction', function () {
    describe('._onMouseOver', function () {
      it('should trigger mouseOverAction', function () {
        view = this.createView();
        view._onMouseOver();

        expect(mouseOverAction).toHaveBeenCalled();
      });
    });
  });

  describe('mouseOutAction', function () {
    describe('._onMouseOut', function () {
      it('should trigger mouseOutAction', function () {
        view = this.createView();
        view._onMouseOut();

        expect(mouseOutAction).toHaveBeenCalled();
      });
    });
  });

  it('should not have leaks', function () {
    view = this.createView();
    expect(view).toHaveNoLeaks();
  });
});
