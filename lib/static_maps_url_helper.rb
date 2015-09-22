module Carto

  class StaticMapsURLHelper

    def url_for_static_map(request, visualization, map_width, map_height)
      static_maps_base_url(request) + static_maps_image_url_fragment(visualization.id, map_width, map_height)
    end

    private

    # INFO: Assumes no trailing '/' comes inside, so returned string doesn't has it either
    def static_maps_base_url(request)
      config = get_static_maps_api_cdn_config

      username = CartoDB.extract_subdomain(request)
      request_protocol = request.protocol.sub('://','')

      if !config.nil? && !config.empty?
        # Sample formats:
        # {protocol}://{user}.cartodb.com
        # {protocol}://zone.cartocdn.com/{user}
        base_url = config
      else
        # Typical format (but all parameters except {user} come already replaced): 
        # {protocol}://{user}.{maps_domain}:{port}/
        base_url = ApplicationHelper.maps_api_template('public')
      end

      base_url.sub('{protocol}', CartoDB.protocol(request_protocol))
              .sub('{user}', username)
    end

    # INFO: To ease testing while we keep the config in a global array...
    def get_static_maps_api_cdn_config
      Cartodb.config[:maps_api_cdn_template]
    end

    def static_maps_image_url_fragment(visualization_id, width, height)
      template_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(visualization_id)

      "/api/v1/map/static/named/#{template_id}/#{width}/#{height}.png"
    end

  end

end