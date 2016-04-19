var $ = require('jquery');
var WidgetDropdownView = require('../../../src/widgets/dropdown/widget-dropdown-view');

describe('widgets/dropdown/widget-dropdown-view', function () {
  afterEach(function () {
    $('.Widget').remove();
  });

  beforeEach(function () {
    $('body').append('<div class="Widget"><button class="js-button"><div class="js-container"></div></button></div>');

    this.model = new cdb.core.Model();
    this.view = new WidgetDropdownView({
      model: this.model,
      target: $('body').find('.js-button'),
      container: $('body').find('.js-container')
    });
  });

  it('should render', function () {
    $('.js-button').click();
    expect($('.js-container').find('.CDB-Dropdown').length).toBe(1);
  });

  it('should detect clicking in the target', function () {
    spyOn(this.view, '_toggleClick').and.callThrough();
    this.view._initBinds();
    $('.js-button').click();
    expect(this.view._toggleClick).toHaveBeenCalled();
  });

  it('should trigger an event when clicking the pinned option', function () {
    var called = false;
    var pinned = null;

    this.model.bind('change:pinned', function (action) {
      called = true;
      pinned = true;
    });

    this.view.render();
    this.view.$('.js-togglePinned').click();

    expect(called).toBe(true);
    expect(pinned).toBe(true);
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
});
