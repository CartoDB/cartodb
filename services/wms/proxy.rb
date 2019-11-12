require 'uri'
require 'nokogiri'
require_relative '../../lib/carto/http/client'

module CartoDB
  module WMS
    class Proxy
      SERVER_XPATH  = "//OnlineResource[1]"
      FORMATS_XPATH = "//GetMap/Format"
      LAYERS_XPATH  = "//Layer/Layer[BoundingBox or LatLonBoundingBox]"

      def initialize(url, preloaded_xml=nil)
        @url        = url
        @response   = preloaded_xml
      end

      def serialize
        run
        { server: server, formats: formats, layers: layers }
      end

      def run
        request_capabilities unless response
        self
      end 

      def request_capabilities
        http_client = Carto::Http::Client.get('wmsproxy')
        response = http_client.get(url, followlocation: true)
        raise URI::InvalidURIError unless [200, 201].include?(response.code)
        @response = response.response_body
        nil
      end 

      def document
        Nokogiri::XML::Document.parse(response).remove_namespaces!
      end

      def server
        (document.at_xpath(SERVER_XPATH) || {})['href']
      end

      def formats
        document.xpath(FORMATS_XPATH).map(&:text)
      end

      def layers

        document.xpath(LAYERS_XPATH).map { |element| 
          name  = element.xpath("./Name").first
          title = element.xpath("./Title").first
          { 
            name:           (name.text if name),
            title:          (title.text if title),
            crs:            crs_for_element(element),
            srs:            srs_for_element(element),
            bounding_boxes: bounding_boxes_for(element),
            attribution:    nil
          } 
        }
      end

      def crs_for_element(element)
        crs = element.xpath("./CRS").map { |element|
          element.text
        }.compact
      end

      def srs_for_element(element)
        srs = element.xpath("./SRS").map { |element|
          element.text
        }.compact
      end

      def bounding_boxes_for(element)
        bounding_boxes = element.xpath("./BoundingBox").map { |element|
          srs   = element.xpath("./@SRS").first
          crs   = element.xpath("./@CRS").first
          minx  = element.xpath("./@minx").first
          miny  = element.xpath("./@miny").first
          maxx  = element.xpath("./@maxx").first
          maxy  = element.xpath("./@maxy").first

          {
            srs: (srs.value if srs),
            crs: (crs.value if crs),
            minx: (minx.value if minx),
            miny: (miny.value if miny),
            maxx: (maxx.value if maxx),
            maxy: (maxy.value if maxy),
          }
        }
      end

      attr_reader :response

      private
      attr_reader :url
    end # Proxy
  end # WMS
end # CartoDB

