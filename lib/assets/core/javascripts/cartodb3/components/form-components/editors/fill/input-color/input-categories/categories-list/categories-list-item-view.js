var _ = require('underscore');
var ImageLoaderView = require('../../../../../../img-loader-view');
var CustomListItemView = require('../../../../../../custom-list/custom-list-item-view');

module.exports = CustomListItemView.extend({
  render: function () {
    this.$el.empty();
    this.clearSubViews();

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
  }
});
