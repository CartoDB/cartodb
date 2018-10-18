var ConfigModel = require('builder/data/config-model');
var InfowindowModel = require('builder/data/infowindow-click-model');

describe('editor/layers/layer-content-view/infowindow/infowindow-click-model', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.model = new InfowindowModel({
      fields: [{name: 'test', title: true, order: 0}]
    }, {
      configModel: this.configModel
    });
  });

  it('should set template_name and template', function () {
    expect(this.model.get('template_name')).toEqual('');
    expect(this.model.get('template')).toEqual('');
    this.model.setTemplate('infowindow_dark');
    expect(this.model.get('template_name')).toEqual('infowindow_dark');
    expect(this.model.get('template')).toContain('<div class="CDB-infowindow CDB-infowindow--dark js-infowindow" style="background:#2E3C43">');
  });

  it('should set default template', function () {
    this.model.setTemplate('infowindow_dark');
    expect(this.model.get('template_name')).toEqual('infowindow_dark');
    this.model.setDefault();
    expect(this.model.get('template_name')).toEqual('');
  });

  it('should empty fields if template is empty', function () {
    expect(this.model.get('fields')).toEqual([{name: 'test', title: true, order: 0}]);
    this.model.setTemplate('');
    expect(this.model.get('fields')).toEqual([]);
  });

  it('should transform template with headerColor if template is infowindow_color', function () {
    expect(this.model.get('template_name')).toEqual('');
    expect(this.model.get('template')).toEqual('');
    this.model.setTemplate('infowindow_color');
    expect(this.model.get('template_name')).toEqual('infowindow_color');
    expect(this.model.get('template')).toContain('div class="CDB-infowindow-header CDB-infowindow-headerBg CDB-infowindow-headerBg--light js-header" style="background: #35AAE5;"');
    this.model.set('headerColor', {
      color: {
        fixed: '#FABADA',
        opacity: 1
      }
    });
    this.model.setTemplate('infowindow_color');
    expect(this.model.get('template_name')).toEqual('infowindow_color');
    expect(this.model.get('template')).toContain('div class="CDB-infowindow-header CDB-infowindow-headerBg CDB-infowindow-headerBg--light js-header" style="background: #FABADA;"');
  });
});
