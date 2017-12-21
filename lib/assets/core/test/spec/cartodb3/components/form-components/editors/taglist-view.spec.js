var Backbone = require('backbone');

describe('components/form-components/editors/taglist', function () {
  beforeEach(function () {
    this.view = new Backbone.Form.editors.Taglist({
      key: 'foo',
      schema: {
        options: {
          tags: ['foo', 'bar', 'lol'],
          isEditable: true
        }
      }
    });
    this.view.render();
    this.view.$el.appendTo(document.body);
  });

  afterEach(function () {
    var parent = this.view.el.parentNode;
    parent && parent.removeChild(this.view.el);
    this.view.remove();
  });

  it('should render properly', function () {
    expect(this.view.$('.tagit-choice').length).toBe(3);
    expect(this.view.$('.tagit-new').length).toBe(1);
    expect(this.view.$('.tagit-choice').eq(0).text()).toContain('foo');
    expect(this.view.$('.tagit-choice').eq(1).text()).toContain('bar');
    expect(this.view.$('.tagit-choice').eq(2).text()).toContain('lol');
  });

  it('should setValue', function () {
    this.view.setValue(['vamos', 'neno']);
    expect(this.view.$('.tagit-choice').length).toBe(2);
    expect(this.view.$('.tagit-choice').eq(0).text()).toContain('vamos');
    expect(this.view.$('.tagit-choice').eq(1).text()).toContain('neno');
  });

  it('should getValue', function () {
    this.view.setValue(['vamos', 'neno']);
    expect(this.view.getValue().length).toBe(2);
  });

  it('should blur and focus properly', function () {
    this.view.$('.tagit-new input').trigger('focus');
    expect(this.view.$el.hasClass('is-focus')).toBe(true);
    this.view.$('.tagit-new input').trigger('blur');
    expect(this.view.$el.hasClass('is-focus')).toBe(false);
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
