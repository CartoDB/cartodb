# encoding: utf-8
require_relative '../../proxy'

include CartoDB::WMS

describe Proxy do
  before do
    @endpoint     = "http://basemap.nationalmap.gov" +
                    "/arcgis/services/USGSImageryTopo/MapServer/WMSServer"
    @query_params = "?service=WMS&request=GetCapabilities"
    @url          = @endpoint + @query_params
    @fixture_xml  = File.expand_path('../../fixtures/wms.xml', __FILE__)
    @xml          = File.read(@fixture_xml)

    sample_response = {
      server: @url,
      formats: ["image/jpeg", "image/png"],
      layers: [
        { 
          name: "layer 1",
          attribution: "attribution message"
        },
        { 
          name: "layer 2",
          attribution: "attribution message"
        }
      ]
    }
  end

  describe '#initialize' do
    it 'takes a URL for the service capabilities' do
      expect { Proxy.new }.to raise_error ArgumentError
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
      proxy = Proxy.new(@url, @xml)
      proxy.run
      proxy.layers.length.should eq 3

      url = "http://www2.demis.nl/worldmap/wms.asp?request=GetCapabilities&version=1.0.0"
      proxy = Proxy.new(url)
      proxy.run
      proxy.layers.empty?.should eq false

      url = "http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/obs?service=WMS&request=GetCapabilities"
      proxy = Proxy.new(url)
      proxy.run
      proxy.layers.empty?.should eq false
    end
  end

  describe '#formats' do
    it 'returns the supported formats' do
      expected_formats = [
        'image/bmp',
        'image/jpeg',
        'image/tiff',
        'image/png',
        'image/png8',
        'image/png24',
        'image/png32',
        'image/gif',
        'image/svg+xml'
      ]

      proxy = Proxy.new(@url, @xml)
      proxy.run
      proxy.formats.sort.should eq expected_formats.sort
    end
  end
end # Proxy

