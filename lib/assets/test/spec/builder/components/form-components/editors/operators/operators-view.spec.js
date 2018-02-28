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

describe('components/form-components/operators/operators-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      currency: {
        operator: 'count',
        attribute: ''
      }
    });

    this.view = new Backbone.Form.editors.Operators({
      key: 'currency',
      schema: {
        options: ['$', '€', '¥']
      },
      model: this.model
    });
    this.view.render();
    this.listView = this.view._operatorsListView;
  });

  it('should genereate an options collection', function () {
    expect(this.view.collection).toBeDefined();
    expect(this.view.collection.size()).toBe(3);
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.view.$('.js-operator').length).toBe(1);
      expect(this.view.$('.js-button').length).toBe(1);
      expect(this.view.$('.js-button').text().toLowerCase()).toContain('count');
    });

    it('should disable the component if option is true', function () {
      this.view.options.disabled = true;
      spyOn(this.view, 'undelegateEvents').and.callThrough();
      this.view._initViews();
      expect(this.view.$('.js-button').hasClass('is-disabled')).toBeTruthy();
      expect(this.view.undelegateEvents).toHaveBeenCalled();
    });

    it('should add is-empty class if there is no value selected', function () {
      this.model.set('currency', '');
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

  it('should change button value when a new values are selected', function () {
    var values = {
      operator: 'sum',
      attribute: '¥'
    };
    this.listView.trigger('change', values);
    expect(this.view.$('.js-button').text().toLowerCase()).toContain('sum(¥)');
    expect(this.view.$('.js-button').hasClass('is-empty')).toBeFalsy();
  });

  it('should open list view if "button" is clicked', function () {
    spyOn(this.listView, 'toggle');
    this.view.$('.js-button').trigger('click');
    expect(this.listView.toggle).toHaveBeenCalled();
  });

  it('should destroy custom list and tooltip when element is removed', function () {
    spyOn(this.listView, 'clean');
    spyOn(this.view, '_removeTooltip');

    this.view.remove();

    expect(this.listView.clean).toHaveBeenCalled();
    expect(this.view._removeTooltip).toHaveBeenCalled();
  });

  describe('with help', function () {
    beforeEach(function () {
      this.view = new Backbone.Form.editors.Operators({
        key: 'currency',
        schema: {
          options: ['$', '€', '¥']
        },
        model: this.model,
        editorAttrs: {
          help: 'help'
        }
      });
    });

    it('should render correctly', function () {
      this.view.render();
      expect(this.view.$('.js-help').attr('data-tooltip')).toContain('help');
    });

    describe('._removeTooltip', function () {
      it('should destroy tooltip', function () {
        spyOn(this.view._helpTooltip, 'clean');

        this.view._removeTooltip();

        expect(this.view._helpTooltip.clean).toHaveBeenCalled();
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.remove();
    this.listView.remove();
  });
});
