var InfowindowView = require('./infowindow-content-view');

/**
 * Select for an Infowindow style type.
 */
module.exports = InfowindowView.extend({

  _initTemplates: function () {
    this._templates = [
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
  }

});
