var Backbone = require('backbone');
var CodeMirrorView = require('../../../../../../javascripts/cartodb3/components/code-mirror/code-mirror-view.js');
describe('components/code-mirror/code-mirror-view', function () {
  var view;

  beforeEach(function () {
    this.model = new Backbone.Model({
      content: 'Foo'
    });

    view = new CodeMirrorView({
      model: this.model,
      tip: 'CMD + S to save'
    });

    spyOn(view, 'setContent').and.callThrough();
    spyOn(view, '_toggleReadOnly').and.callThrough();

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('.CodeMirror-editor').length).toBe(1);
    expect(view.$('.CodeMirror-console').length).toBe(1);
    expect(view.$('.js-editor').html()).toContain('Foo');
    expect(view.$('.js-console').html()).toContain('CMD + S');
  });

  it('should bind change:content properly', function () {
    this.model.set('content', 'Bar');
    expect(view.setContent).toHaveBeenCalledWith('Bar');
  });

  it('should bind change:readonly properly', function () {
    this.model.set('readonly', true);
    expect(view._toggleReadOnly).toHaveBeenCalled();
    expect(view.$('.js-console').attr('style')).toContain('display: none');
    expect(view.editor.getOption('theme')).toBe('');
    expect(view.editor.getOption('readOnly')).toBe(true);
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
