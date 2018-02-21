var _ = require('underscore');
var $ = require('jquery');
var ImageLoaderView = require('builder/components/img-loader-view');
var CustomListItemView = require('builder/components/custom-list/custom-list-item-view');

module.exports = CustomListItemView.extend({
  module: 'components:form-components:editors:fill:input-color:input-qualitative-ramps:categories-list:list-item-view:categories-list-item-view',

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var name = this.model.getName() == null ? 'null' : this.model.getName();

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
          image: this.model.get('image'),
          imageEnabled: this.options.imageEnabled
        })
      )
    );

    this._loadImages();

    this.$el
      .attr('data-val', this.model.getValue())
      .toggleClass('is-disabled', !!this.model.get('disabled'));

    return this;
  },

  _loadImages: function () {
    this.iconView = new ImageLoaderView({
      imageClass: 'CDB-Text u-actionTextColor js-assetPicker',
      imageUrl: this.model.get('image'),
      color: this.model.get('val')
    });
    this.addView(this.iconView);
    this.$('.js-image-container').append(this.iconView.render().el);
  },

  _onClick: function (ev) {
    this.killEvent(ev);
    var $target = $(ev.target);
    var isIconClicked = $target.closest('.js-image-container').length > 0;
    var isImgClicked = $target.closest('.js-assetPicker').length > 0;

    this.model.set({
      selectedClass: isImgClicked || isIconClicked ? ['js-assetPicker'] : [],
      selected: true
    });
  }
});
