var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetTooltipView = require('../../src/widgets/widget-tooltip-view');

describe('widget tooltip view', function () {
  beforeEach(function () {
    var Mock = cdb.core.View.extend({
      render: function () {
        var template = '<div style="width: 100px; height: 100px; position:absolute; top:0; left:0;"><div class="foo" style="position:absolute; top:50px; left: 50px" data-tooltip="wadus">Wadus</div></div>';
        this.$el.append(template);
        return this;
      }
    });

    this.mockView = new Mock();
    this.mockView.render();
    document.body.appendChild(this.mockView.el);
  });

  afterEach(function () {
    document.body.removeChild(this.mockView.el);
  });

  describe('render', function () {
    beforeEach(function () {
      this.view = new WidgetTooltipView({
        context: this.mockView,
        event: 'wadus'
      });

      this.view.render();
    });

    it('should have CDB-Widget-tooltip class', function () {
      this.mockView.trigger('wadus', {
        target: this.mockView.$('.foo').get(0)
      });

      expect(this.view.el.classList).toContain('CDB-Widget-tooltip');
    });

    it('should show data attribute', function () {
      this.mockView.trigger('wadus', {
        target: this.mockView.$('.foo').get(0)
      });

      expect(this.view.$el.html()).toContain('wadus');
    });
  });

  describe('target', function () {
    beforeEach(function () {
      spyOn(WidgetTooltipView.prototype, 'show').and.callThrough();
      spyOn(WidgetTooltipView.prototype, 'hide').and.callThrough();

      this.view = new WidgetTooltipView({
        context: this.mockView.$el,
        target: '.foo'
      });

      this.view.render();
    });

    it('should show tooltip when mouseenter', function () {
      var event = $.Event('mouseenter', {
        target: this.mockView.$('.foo').get(0)
      });

      this.mockView.$el.trigger(event);

      expect(WidgetTooltipView.prototype.show).toHaveBeenCalled();
    });

    it('should hide tooltip on mouseleave', function () {
      var event = $.Event('mouseleave', {
        target: this.mockView.$('.foo').get(0)
      });

      this.mockView.$el.trigger(event);

      expect(WidgetTooltipView.prototype.hide).toHaveBeenCalled();
    });
  });

  describe('custom event', function () {
    beforeEach(function () {
      spyOn(WidgetTooltipView.prototype, 'show').and.callThrough();
      spyOn(WidgetTooltipView.prototype, 'hide').and.callThrough();

      this.view = new WidgetTooltipView({
        context: this.mockView,
        event: 'wadus'
      });

      this.view.render();
    });

    it('should show tooltip on custom events properly', function () {
      this.mockView.trigger('wadus', {
        target: this.mockView.$('.foo').get(0)
      });

      expect(WidgetTooltipView.prototype.show).toHaveBeenCalled();
    });

    it('should hide tooltip on custom events properly', function () {
      this.mockView.trigger('wadus', {
        target: null
      });

      expect(WidgetTooltipView.prototype.hide).toHaveBeenCalled();
    });
  });
});
