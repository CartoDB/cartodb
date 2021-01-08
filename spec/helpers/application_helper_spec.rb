require 'spec_helper_min'

describe ApplicationHelper do
  describe '#app_assets_base_url' do
    before(:each) do
      allow(CartoDB).to receive(:protocol).and_return('http')
      allow(CartoDB).to receive(:http_port).and_return(nil)
    end

    describe 'with asset_host (SaaS)' do
      it 'returns asset_host' do
        allow(Cartodb).to receive(:get_config).with(:app_assets, 'asset_host').and_return('https://carto.global.ssl.fastly.net/cartodbui')

        ApplicationHelper.app_assets_base_url.should eq 'https://carto.global.ssl.fastly.net/cartodbui/assets'
      end

      it 'returns asset_host and adds the protocol if needed' do
        allow(Cartodb).to receive(:get_config).with(:app_assets, 'asset_host').and_return('//carto.global.ssl.fastly.net/cartodbui')

        ApplicationHelper.app_assets_base_url.should eq 'http://carto.global.ssl.fastly.net/cartodbui/assets'
      end
    end

    describe 'without asset_host' do
      before(:each) do
        allow(Cartodb).to receive(:get_config).with(:app_assets, 'asset_host').and_return('')
        request = double
        allow(request).to receive(:params).and_return(user_domain: 'pepe')
        allow(request).to receive(:host).and_return('org.localhost.lan')

        allow(ApplicationHelper).to receive(:request).and_return(request)
      end

      it 'with subdomainful urls (OSS/dev) returns a subdomain' do
        allow(CartoDB).to receive(:subdomainless_urls?).and_return(false)
        allow(CartoDB).to receive(:session_domain).and_return('.localhost.lan')

        ApplicationHelper.app_assets_base_url.should eq 'http://org.localhost.lan/assets'
      end

      it 'with subdomainless urls (onpremise) returns the domain' do
        allow(CartoDB).to receive(:subdomainless_urls?).and_return(true)
        allow(CartoDB).to receive(:session_domain).and_return('localhost.lan')

        ApplicationHelper.app_assets_base_url.should eq 'http://localhost.lan/assets'
      end
    end
  end
end
