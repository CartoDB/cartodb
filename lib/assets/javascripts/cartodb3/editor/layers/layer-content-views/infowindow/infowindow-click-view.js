var InfowindowView = require('./infowindow-view');
var fs = require('fs');

/**
 * Select for an Infowindow style type.
 */
module.exports = InfowindowView.extend({

  _initTemplates: function () {
    this._templates = [
      {
        value: '',
        label: _t('editor.layers.infowindow.style.none'),
        compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../../../../mustache-templates/infowindows/infowindow_light.jst.mustache', 'utf8'), 'mustache')
      }, {
        value: 'infowindow_light',
        label: _t('editor.layers.infowindow.style.light'),
        compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../../../../mustache-templates/infowindows/infowindow_light.jst.mustache', 'utf8'), 'mustache')
      }, {
        value: 'infowindow_dark',
        label: _t('editor.layers.infowindow.style.dark'),
        compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../../../../mustache-templates/infowindows/infowindow_light.jst.mustache', 'utf8'), 'mustache')
      }, {
        value: 'infowindow_light_header_blue',
        label: _t('editor.layers.infowindow.style.color'),
        compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../../../../mustache-templates/infowindows/infowindow_light.jst.mustache', 'utf8'), 'mustache')
      }, {
        value: 'infowindow_header_with_image',
        label: _t('editor.layers.infowindow.style.image'),
        compiled: cdb.core.Template.compile(fs.readFileSync(__dirname + '/../../../../mustache-templates/infowindows/infowindow_light.jst.mustache', 'utf8'), 'mustache')
      }
    ];
  }

});
