var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var ExportMapModel = require('builder/data/export-map-definition-model');
var ExportView = require('builder/editor/components/modals/export-map/modal-export-map-view');
var templateExportMapDownload = require('builder/editor/components/modals/export-map/export-map-download.tpl');

describe('editor/components/modals/export-map/modal-export-map-view', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.visDefinitionModel = new VisDefinitionModel({
      name: 'Patatas Bravas',
      id: 'v-123'
    }, {
      configModel: configModel
    });

    this.exportMapModel = new ExportMapModel({
      visualization_id: this.visDefinitionModel.get('id')
    }, {
      configModel: configModel
    });

    this.view = new ExportView({
      modalModel: new Backbone.Model(),
      exportMapModel: this.exportMapModel,
      renderOpts: {
        name: this.visDefinitionModel.get('name')
      }
    });

    spyOn(this.view, '_renderCompleteView').and.callFake(function () {
      this.$el.html(templateExportMapDownload());
    });

    this.view.render();
  });

  describe('render', function () {
    it('should render confirmation view if state is undefined', function () {
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.confirmation.title', {
        name: this.visDefinitionModel.get('name')
      }));
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.confirmation.desc'));
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.confirmation.cancel'));
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.confirmation.confirm'));
    });

    it('should render pending view when pending state', function () {
      var state = 'pending';

      this.exportMapModel.set('state', state);
      this.view.render();

      expect(this.view.$el.html()).toContain(state.charAt(0).toUpperCase() + state.slice(1) + ' ...');
    });

    it('should render uploading view when uploading', function () {
      var state = 'uploading';

      this.exportMapModel.set('state', state);
      this.view.render();

      expect(this.view.$el.html()).toContain(state.charAt(0).toUpperCase() + state.slice(1) + ' ...');
    });

    it('should render exporting view when exporting', function () {
      var state = 'exporting';

      this.exportMapModel.set('state', state);
      this.view.render();

      expect(this.view.$el.html()).toContain(state.charAt(0).toUpperCase() + state.slice(1) + ' ...');
    });

    it('should render complete view when complete', function () {
      this.exportMapModel.set('state', 'complete');
      this.view.render();

      expect(this.view.$el.html()).toContain(_t('editor.maps.export.download.title'));
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.download.tip'));
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.download.desc'));
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.download.confirm'));
    });

    it('should render error view when failure', function () {
      this.exportMapModel.set('state', 'failure');
      this.view.render();

      expect(this.view.$el.html()).toContain(_t('editor.maps.export.error.title'));
      expect(this.view.$el.html()).toContain(_t('editor.maps.export.error.desc'));
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
