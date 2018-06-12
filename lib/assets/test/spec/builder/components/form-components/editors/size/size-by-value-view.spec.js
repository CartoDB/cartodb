var Backbone = require('backbone');
var _ = require('underscore');
var SizeByValueView = require('builder/components/form-components/editors/size/size-by-value-view');
var FillConstants = require('builder/components/form-components/_constants/_fill');

describe('components/form-components/editors/size/size-by-value-view', function () {
  var view;
  var defaultSettings = FillConstants.Settings.NUMBER;

  function createView (options) {
    options = options || {
      model: new Backbone.Model({}),
      columns: {},
      popupConfig: {}
    };
    return new SizeByValueView(options);
  }

  describe('initialize', function () {
    it('model is set with default options', function () {
      view = createView();

      expect(view.model.get('quantification')).toEqual(defaultSettings.quantifications.items[defaultSettings.quantifications.defaultIndex]);
      expect(view.model.get('bins')).toBe(defaultSettings.bins.items[defaultSettings.bins.defaultIndex]);
    });

    it('model is initialized with options', function () {
      view = createView({
        model: new Backbone.Model({
          quantification: 'jenks',
          bins: 7
        }),
        columns: {},
        popupConfig: {}
      });

      expect(view.model.get('quantification')).toEqual('jenks');
      expect(view.model.get('bins')).toBe(7);
    });

    it('model bins get limited by settings', function () {
      view = createView({
        model: new Backbone.Model({
          bins: _.last(defaultSettings.bins.items) + 1
        }),
        columns: {},
        popupConfig: {}
      });

      expect(view.model.get('bins')).toBe(_.last(defaultSettings.bins.items));
    });

    it('attribute change triggers render', function () {
      view = createView({
        model: new Backbone.Model({
          attribute: 'an_attribute'
        }),
        columns: {},
        popupConfig: {}
      });
      expect(view.el.children.length).toBe(0);

      view.model.set('attribute', 'another_attribute');

      expect(view.el.children.length).not.toBe(0);
    });

    it('range change triggers render', function () {
      view = createView({
        model: new Backbone.Model({
          range: [0, 5]
        }),
        columns: {},
        popupConfig: {}
      });
      expect(view.el.children.length).toBe(0);

      view.model.set('range', [3, 7]);

      expect(view.el.children.length).not.toBe(0);
    });
  });

  describe('render', function () {
    it('calls to _initViews', function () {
      view = createView();
      spyOn(view, '_initDialog');
      spyOn(view, '_initPopup');
      spyOn(view, '_initInputColumn');

      view.render();

      expect(view._initDialog).toHaveBeenCalled();
      expect(view._initPopup).toHaveBeenCalled();
      expect(view._initInputColumn).toHaveBeenCalled();
    });

    it('renders the column info', function () {
      view = createView({
        model: new Backbone.Model({
          attribute: 'price',
          range: [3, 9]
        }),
        columns: {},
        popupConfig: {
          cid: 357,
          $el: 'an_element'
        }
      });

      view.render();

      expect(view.$('.by-column-name').text().trim()).toEqual('price');
      expect(view.$('.by-column-range').text().trim()).toEqual('3 - 9');
    });
  });

  describe('_initDialog', function () {
    it('creates the dialog view and binds destroy', function () {
      view = createView();
      expect(view._dialogView).not.toBeDefined();

      view._initDialog();

      expect(view._dialogView).toBeDefined();

      view._dialogView.model.trigger('destroy');

      expect(view._dialogView).toBeNull();
    });
  });

  describe('_initPopup', function () {
    it('popupmanager gets created', function () {
      view = createView({
        model: new Backbone.Model({}),
        columns: {},
        popupConfig: {
          cid: 357,
          $el: 'an_element'
        }
      });
      expect(view._popupManager).not.toBeDefined();

      view._initDialog();
      view._initPopup();

      expect(view._popupManager.id).toBe(357);
      expect(view._popupManager.reference).toEqual('an_element');
      expect(view._popupManager.popup).toBe(view._dialogView.$el);
    });
  });

  describe('events', function () {
    it('should hookup selectors with functions', function () {
      view = createView();

      expect(view.events['click .js-button']).toEqual('_showByValueDialog');
      expect(view.events['click .js-back']).toEqual('_onClickBack');
    });
  });
});
