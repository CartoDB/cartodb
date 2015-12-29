var $ = require('jquery');
var WidgetDropdownView = require('../../../src/widgets/dropdown/widget-dropdown-view');

describe('widgets/dropdown/widget-dropdown-view', function () {
  afterEach(function () {
    $('.Widget').remove();
  });

  beforeEach(function () {
    $('body').append('<div class="Widget"><button class="js-button"><div class="js-container"></div></button></div>');

    this.view = new WidgetDropdownView({
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

  it('should trigger an event when clicking an option', function () {
    var called = false;
    var name = null;

    this.view.bind('click', function (action) {
      called = true;
      name = action;
    });

    this.view.render();
    this.view.$('button:nth(1)').click();

    expect(called).toBe(true);
    expect(name).toBe('pin');
  });

  it('should close the dropdown when clicking an option', function () {
    spyOn(this.view, '_close').and.callThrough();
    $('.js-button').click();

    expect($('.js-container').find('.CDB-Dropdown').css('display')).toBe('block');
    expect(this.view.viewModel.get('open')).toBe(true);

    this.view.$('button:nth(0)').click();

    expect(this.view._close).toHaveBeenCalled();
    expect(this.view.viewModel.get('open')).toBe(false);
    expect($('.js-container').find('.CDB-Dropdown').css('display')).toBe('none');
  });
});
