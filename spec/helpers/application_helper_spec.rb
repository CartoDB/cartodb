require 'spec_helper_min'

describe ApplicationHelper do
  describe '#app_assets_base_url' do
    it 'returns asset_host if present (SaaS)' do
      CartoDB.stubs(:protocol).returns('http')
      Cartodb.stubs(:get_config).with(:app_assets, 'asset_host').returns('//carto.global.ssl.fastly.net/cartodbui')

      ApplicationHelper.app_assets_base_url.should eq 'http://carto.global.ssl.fastly.net/cartodbui/assets'
    end
  end
end
