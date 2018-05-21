var $ = require('jquery');
var WidgetDropdownView = require('../../../../../javascripts/deep-insights/widgets/dropdown/widget-dropdown-view');
var cdb = require('internal-carto.js');

describe('widgets/dropdown/widget-dropdown-view', function () {
  afterEach(function () {
    $('.Widget').remove();
  });

  beforeEach(function () {
    $('body').append('<div class="Widget"><div class="js-container"><button class="js-button"></button></div></div>');

    this.model = new cdb.core.Model();
    this.view = new WidgetDropdownView({
      model: this.model,
      target: '.js-button',
      container: $('body').find('.js-container')
    });
  });

  it('should render', function () {
    $('.js-button').click();
    expect($('.js-container').find('.CDB-Dropdown').length).toBe(1);
  });

  it('should not be the options edit and delete button', function () {
    this.view.options.flags = {
      normalizeHistogram: true
    };
    $('.js-button').click();

    expect($('.js-container').find('li').length).toBe(2);
    expect($('.js-container').find('.js-editWidget').length).toBe(0);
    expect($('.js-container').find('.js-removeWidget').length).toBe(0);
  });

  it('should be the options button', function () {
    this.model.set('show_options', true);
    this.view.options.flags = {
      normalizeHistogram: true
    };

    $('.js-button').click();

    expect($('.js-container').find('li').length).toBe(4);
    expect($('.js-container').find('.js-editWidget').length).toBe(1);
    expect($('.js-container').find('.js-removeWidget').length).toBe(1);
  });

  it('should detect clicking in the target', function () {
    spyOn(this.view, '_toggle').and.callThrough();
    this.view._initBinds();
    $('.js-button').click();
    expect(this.view._toggle).toHaveBeenCalled();
  });

  it('should trigger an event when clicking the collapsed option', function () {
    var called = false;
    var collapsed = null;

    this.model.bind('change:collapsed', function (action) {
      called = true;
      collapsed = true;
    });

    this.view.render();
    this.view.$('.js-toggleCollapsed').click();

    expect(called).toBe(true);
    expect(collapsed).toBe(true);
  });

  it('should close the dropdown when clicking an option', function () {
    spyOn(this.view, '_close').and.callThrough();
    $('.js-button').click();

    expect($('.js-container').find('.CDB-Dropdown').css('display')).toBe('block');
    expect(this.view.model.get('widget_dropdown_open')).toBe(true);

    this.view.$('button:nth(0)').click();

    expect(this.view._close).toHaveBeenCalled();
    expect(this.view.model.get('widget_dropdown_open')).toBe(false);
    expect($('.js-container').find('.CDB-Dropdown').css('display')).toBe('none');
  });

  describe('canCollapse flag', function () {
    it('should not render collapse toggle if set to false', function () {
      this.view = new WidgetDropdownView({
        model: this.model,
        target: '.js-button',
        container: $('body').find('.js-container'),
        flags: {
          canCollapse: false
        }
      });

      this.view.render();

      expect(this.view.$('.js-toggleCollapsed').length).toBe(0);
    });
  });

  describe('localTimezone', function () {
    var view;

    beforeEach(function () {
      var model = new cdb.core.Model({
        local_timezone: false
      });

      view = new WidgetDropdownView({
        model: model,
        target: '.js-button',
        container: $('body').find('.js-container'),
        flags: {
          localTimezone: true
        }
      });
    });

    afterEach(function () {
      view && view.clean();
    });

    it('should render local timezone toggle if set to true', function () {
      view.render();

      expect(view.$('.js-toggleLocalTimezone').length).toBe(1);
    });

    it('should trigger an event when clicking the local timezone option', function () {
      view.render();
      expect(view.model.get('local_timezone')).toBe(false);

      view.$('.js-toggleLocalTimezone').click();

      expect(view.model.get('local_timezone')).toBe(true);
    });
  });

  describe('._adjustVerticalPosition', function () {
    it('should add `has-top-position` class if it doesnt fit to the bottom', function () {
      spyOn(this.view, '_getBodyHeight').and.returnValue(20);
      spyOn(this.view, '_getDropdownBottom').and.returnValue(21);

      this.view.render();
      this.view._adjustVerticalPosition();

      expect(this.view.$el.hasClass('has-top-position')).toBe(true);
    });
  });
});
