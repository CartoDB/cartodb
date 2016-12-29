var _ = require('underscore');
var ImageLoaderView = require('../img-loader-view');

module.exports = ImageLoaderView.extend({

  options: {
    template: require('./custom-list-item.tpl')
  },

  className: 'CDB-ListDecoration-item CustomList-item js-listItem',
  tagName: 'li',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function (opts) {
    this.options = _.extend({}, this.options, opts);
    this.model.on('change', this.render, this);

    ImageLoaderView.prototype.initialize.call(this, {
      imageClass: 'CDB-Text u-actionTextColor js-assetPicker'
    });
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    var name = this.model.getName() === null ? 'null' : this.model.getName();

    this.$el.append(
      this.options.template(
        _.extend({
          typeLabel: this.options.typeLabel,
          isSelected: this.model.get('selected'),
          isDisabled: this.model.get('disabled'),
          isDestructive: this.model.get('destructive'),
          name: name,
          val: this.model.getValue(),
          options: this.model.get('renderOptions'),
          image: this.model.get('image')
        })
      )
    );

    this._loadImage(this.model.get('image'), this.model.get('val'));

    this.$el
      .attr('data-val', this.model.getValue())
      .toggleClass('is-disabled', !!this.model.get('disabled'));

    return this;
  },

  _onMouseLeave: function () {
    this.$el.removeClass('is-highlighted');
  },

  _onMouseEnter: function () {
    this.$el.addClass('is-highlighted');
  },

  _onClick: function (ev) {
    this.killEvent(ev);
    this.model.set('selectedClass', ev.target.classList, { silent: true });
    this.model.set('selected', true);
  }
});
