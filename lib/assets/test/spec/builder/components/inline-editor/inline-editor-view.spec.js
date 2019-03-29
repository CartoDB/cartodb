var InlineEditorView = require('builder/components/inline-editor/inline-editor-view');
var template = require('builder/editor/inline-editor.tpl');

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
  });

  afterEach(function () {
    var parent = view.el.parentNode;
    parent && parent.removeChild(view.el);
    view.clean();
    jasmine.clock().uninstall();
  });

  it('should render properly', function () {
    expect(view.$('.js-input').length).toBe(1);
    expect(view.$('.js-title').length).toBe(1);
  });

  it('should responde to double click', function () {
    view.$el.appendTo(document.body);
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

    view2.clean();
  });

  it('.getValue', function () {
    view = new InlineEditorView({
      template: template,
      onEdit: onEdit,
      onClick: onClick,
      renderOptions: {
        name: '<img src="http://emojipedia-us.s3.amazonaws.com/cache/b8/b4/b8b4e86a110557e6b6d666c9cf6d6cc8.png" />'
      }
    });
    view.render();

    var value = view.getValue();

    expect(value).toEqual('<img src="http://emojipedia-us.s3.amazonaws.com/cache/b8/b4/b8b4e86a110557e6b6d666c9cf6d6cc8.png" />');
    view.clean();
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
