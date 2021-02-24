require 'spec_helper_min'
require_relative '../../proxy'

include CartoDB::WMS

describe Proxy do
  before do
    @endpoint     = 'http://basemap.nationalmap.gov' +
                    '/arcgis/services/USGSImageryTopo/MapServer/WMSServer'
    @query_params = '?service=WMS&request=GetCapabilities'
    @url          = @endpoint + @query_params
    @fixture_xml  = File.expand_path('../../fixtures/wms.xml', __FILE__)
    @xml          = File.read(@fixture_xml)
  end

  describe '#initialize' do
    it 'takes a URL for the service capabilities' do
      expect {
        Proxy.new
      }.to raise_error ArgumentError
      Proxy.new(@url)
    end

    it 'accepts an optional preloaded response' do
      proxy = Proxy.new(@url, @xml)
      proxy.response.should eq @xml
    end
  end

  describe '#serialize' do
    it 'returns a hash representation of the WMS capabilities' do
      proxy = Proxy.new(@url, @xml)
      representation = proxy.serialize
      representation.fetch(:server).nil?.should eq false
      representation.fetch(:formats).empty?.should eq false
      representation.fetch(:layers).empty?.should eq false
    end
  end

  describe '#run' do
    it 'will not touch the preloaded response if passed at initialization' do
      proxy = Proxy.new(@url, @xml)
      proxy.response.should eq @xml
      proxy.run
      proxy.response.should eq @xml
    end
  end

  describe '#server' do
    it 'returns the HTTP/HTTPS entry point for the services' do
      proxy = Proxy.new(@url, @xml)
      proxy.run
      proxy.server.should eq @endpoint
    end
  end

  describe '#layers' do
    it 'returns available layers' do
      nasa_wms = File.read(File.expand_path('../../fixtures/wms_nasa.xml', __FILE__))
      Typhoeus.stub(
        'http://wms.jpl.nasa.gov/wms.cgi?Service=WMS&Version=1.1.1&Request=GetCapabilities',
       { method: :get}  )
      .and_return(
        Typhoeus::Response.new(code: 200, body: nasa_wms)
      )

      noaa_wms = File.read(File.expand_path('../../fixtures/wms_noaa.xml', __FILE__))
      Typhoeus.stub(
          'http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/obs?service=WMS&request=GetCapabilities',
          { method: :get}  )
      .and_return(
          Typhoeus::Response.new(code: 200, body: noaa_wms)
      )

      proxy = Proxy.new(@url, @xml)
      proxy.run
      proxy.layers.length.should eq 3

      url = 'http://wms.jpl.nasa.gov/wms.cgi?Service=WMS&Version=1.1.1&Request=GetCapabilities'
      proxy = Proxy.new(url)
      proxy.run

      proxy.layers.empty?.should eq false

      url = 'http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/obs?service=WMS&request=GetCapabilities'
      proxy = Proxy.new(url)
      proxy.run
      proxy.layers.empty?.should eq false
    end
  end

  describe '#formats' do
    it 'returns the supported formats' do
      expected_formats = %w{ image/bmp image/jpeg image/tiff image/png image/png8 image/png24 image/png32 image/gif image/svg+xml }
      proxy = Proxy.new(@url, @xml)
      proxy.run
      proxy.formats.sort.should eq expected_formats.sort
    end
  end
end # Proxy
