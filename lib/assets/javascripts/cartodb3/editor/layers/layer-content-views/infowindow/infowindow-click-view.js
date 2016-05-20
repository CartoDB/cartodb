var InfowindowView = require('./infowindow-content-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
var _ = require('underscore');

/**
 * Select for an Infowindow style type.
 */
module.exports = InfowindowView.extend({

  _initCollection: function () {
    var styles = [
      {
        value: '',
        label: _t('editor.layers.infowindow.style.none')
      }, {
        value: 'infowindow_light',
        label: _t('editor.layers.infowindow.style.light')
      }, {
        value: 'infowindow_dark',
        label: _t('editor.layers.infowindow.style.dark')
      }, {
        value: 'infowindow_light_header_blue',
        label: _t('editor.layers.infowindow.style.color')
      }, {
        value: 'infowindow_header_with_image',
        label: _t('editor.layers.infowindow.style.image')
      }
    ];

    this._templateStyles = new CarouselCollection(
      _.map(styles, function (style) {
        return {
          selected: this._layerInfowindowModel.get('template_name') === style.value,
          val: style.value,
          label: style.label,
          template: function () {
            return style.label;
          }
        };
      }, this)
    );
  }

});
