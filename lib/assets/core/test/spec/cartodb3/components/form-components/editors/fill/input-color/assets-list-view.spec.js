var cdb = require('cartodb.js');
var AssetsListView = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets-picker/assets-list-view');
var MakiIcons = require('../../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/assets/maki-icons.js');

describe('components/form-components/editors/fill/input-color/assets-list-view', function () {
  beforeEach(function () {
    this.model = new cdb.core.Model();
    this.selectedAsset = new cdb.core.Model();

    this.view = new AssetsListView({
      model: this.model,
      selectedAsset: this.selectedAsset,
      title: 'Title',
      icons: MakiIcons.icons,
      disclaimer: 'Disclaimer',
      folder: 'folder',
      kind: 'marker',
      size: '10'
    });

    this.view.render();
  });

  it('should render the assets', function () {
    expect(this.view.$el.find('.AssetsList-item').size()).toBe(MakiIcons.icons.length);
  });

  it('should select an asset', function () {
    var url = this.view.$('.AssetsList-item:nth-child(1) img').attr('src');
    this.view.$('.AssetsList-item:nth-child(1) .js-asset').click();
    expect(this.selectedAsset.get('url')).toBe(url);
    expect(this.selectedAsset.get('kind')).toBe('marker');
  });
});
