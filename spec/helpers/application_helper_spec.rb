require 'spec_helper_min'

describe ApplicationHelper do
  describe '#app_assets_base_url' do
    before(:each) do
      CartoDB.stubs(:protocol).returns('http')
      CartoDB.stubs(:http_port).returns(nil)
    end

    describe 'with asset_host (SaaS)' do
      it 'returns asset_host' do
        Cartodb.stubs(:get_config).with(:app_assets, 'asset_host').returns('https://carto.global.ssl.fastly.net/cartodbui')

        ApplicationHelper.app_assets_base_url.should eq 'https://carto.global.ssl.fastly.net/cartodbui/assets'
      end

      it 'returns asset_host and adds the protocol if needed' do
        Cartodb.stubs(:get_config).with(:app_assets, 'asset_host').returns('//carto.global.ssl.fastly.net/cartodbui')

        ApplicationHelper.app_assets_base_url.should eq 'http://carto.global.ssl.fastly.net/cartodbui/assets'
      end
    end

    describe 'without asset_host' do
      before(:each) do
        Cartodb.stubs(:get_config).with(:app_assets, 'asset_host').returns('')
        request = mock
        request.stubs(:params).returns(user_domain: 'pepe')
        request.stubs(:host).returns('org.localhost.lan')

        ApplicationHelper.stubs(:request).returns(request)
      end

      it 'with subdomainful urls (OSS/dev) returns a subdomain' do
        CartoDB.stubs(:subdomainless_urls?).returns(false)
        CartoDB.stubs(:session_domain).returns('.localhost.lan')

        ApplicationHelper.app_assets_base_url.should eq 'http://org.localhost.lan/assets'
      end

      it 'with subdomainless urls (onpremise) returns the domain' do
        CartoDB.stubs(:subdomainless_urls?).returns(true)
        CartoDB.stubs(:session_domain).returns('localhost.lan')

        ApplicationHelper.app_assets_base_url.should eq 'http://localhost.lan/assets'
      end
    end
  end
end
