var InlineEditorView = require('../../../../../javascripts/cartodb3/components/inline-editor/inline-editor-view');
var template = require('../../../../../javascripts/cartodb3/editor/inline-editor.tpl');

describe('components/inline-editor/inline-editor-view', function () {
  var view;
  var onEdit;
  var onClick;

  beforeEach(function () {
    jasmine.clock().install();

    onEdit = jasmine.createSpy('onEdit');
    onClick = jasmine.createSpy('onClick');

    view = new InlineEditorView({
      template: template,
      onEdit: onEdit,
      onClick: onClick,
      renderOptions: {
        name: 'Foo'
      }
    });

    view.render();
    view.$el.appendTo(document.body);
  });

  afterEach(function () {
    view.remove();
    jasmine.clock().uninstall();
  });

  it('should render properly', function () {
    expect(view.$('.js-input').length).toBe(1);
    expect(view.$('.js-title').length).toBe(1);
  });

  it('should responde to double click', function () {
    view.$('.js-input').hide(); // to simulate the css class
    expect(view.$('.js-input').prop('readonly')).toBe(true);
    view.$('.js-title').trigger('click');
    view.$('.js-title').trigger('click');
    jasmine.clock().tick(201);
    expect(view.$('.js-input').is(':visible')).toBe(true);
    expect(view.$('.js-input').prop('readonly')).toBe(false);
  });

  it('should responde to single click', function () {
    view.$('.js-title').trigger('click');
    jasmine.clock().tick(201);
    expect(onClick).toHaveBeenCalled();
  });

  it('should not respond click if not passed as option', function () {
    var view2 = new InlineEditorView({
      template: template,
      onEdit: onEdit,
      renderOptions: {
        name: 'Foo'
      }
    });
    spyOn(view2, '_onClickHandler').and.callThrough();

    view2.render();
    view2.$('.js-title').trigger('click');
    jasmine.clock().tick(201);
    expect(view2._onClickHandler).not.toHaveBeenCalled();

    view2.remove();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
