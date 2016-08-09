module Carto

  class StaticMapsURLHelper

    def url_for_static_map(request, visualization, map_width, map_height)
      username = CartoDB.extract_subdomain(request)
      request_protocol = request.protocol.sub('://', '')
      static_maps_base_url(username, request_protocol) +
        static_maps_image_url_fragment(visualization.id, map_width, map_height)
    end

    def url_for_static_map_without_request(username, request_protocol, visualization, map_width, map_height)
      static_maps_base_url(username, request_protocol) +
        static_maps_image_url_fragment(visualization.id, map_width, map_height)
    end

    def url_for_static_map_with_visualization(visualization, request_protocol, map_width, map_height)
      static_maps_base_url(visualization.user.username, request_protocol) +
        static_maps_image_url_fragment(visualization.id, map_width, map_height)
    end

    private

    # INFO: Assumes no trailing '/' comes inside, so returned string doesn't has it either
    def static_maps_base_url(username, request_protocol)
      config = get_cdn_config
      if !config.nil? && !config.empty?
        "#{request_protocol}://#{config[request_protocol]}/#{username}"
      else
        # sample format: {protocol}://{user}.{maps_domain}:{port}/
        # All parameters except {user} come already replaced
        ApplicationHelper.maps_api_template('public').sub('{user}', username)
      end
    end

    # INFO: To ease testing while we keep the config in a global array...
    def get_cdn_config
      Cartodb.config[:cdn_url]
    end

    def static_maps_image_url_fragment(visualization_id, width, height)
      template_name = Carto::NamedMaps::Template.new(Carto::Visualization.find(visualization_id)).name

      "/api/v1/map/static/named/#{template_name}/#{width}/#{height}.png"
    end

  end
end
