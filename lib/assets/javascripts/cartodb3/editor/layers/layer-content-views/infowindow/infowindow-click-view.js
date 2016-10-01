var InfowindowView = require('./infowindow-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = InfowindowView.extend({

  _initTemplates: function () {
    this._templates = [
      {
        value: '',
        infowindowIcon: require('./infowindow-icons/infowindow-none.tpl'),
        label: _t('editor.layers.infowindow.style.none')
      }, {
        value: 'infowindow_light',
        infowindowIcon: require('./infowindow-icons/infowindow-light.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_light')
      }, {
        value: 'infowindow_dark',
        infowindowIcon: require('./infowindow-icons/infowindow-dark.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_dark')
      }, {
        value: 'infowindow_color',
        infowindowIcon: require('./infowindow-icons/infowindow-color.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_color')
      }, {
        value: 'infowindow_header_with_image',
        infowindowIcon: require('./infowindow-icons/infowindow-image.tpl'),
        label: _t('editor.layers.infowindow.style.infowindow_header_with_image')
      }
    ];
  }

});
