
# encoding: utf-8

require 'uri'

class Api::Json::OembedController < Api::ApplicationController
  include CartoDB

  skip_before_filter :api_authorization_required

  # Returns oembed data as required
  def show
    url = params[:url]
    width = params[:maxwidth] || '100%'
    height = params[:maxheight] || '100%'
    format = request.query_parameters[:format]
    force_https = true if params[:allow_http].nil?

    if (width =~ /^[0-9]+(%|px)?$/) == nil
      raise ActionController::RoutingError.new('Incorrect width')
    end
    if (height =~ /^[0-9]+(%|px)?$/) == nil
      raise ActionController::RoutingError.new('Incorrect height')
    end

    uri = URI.parse(url)

    if uri.host != request.host
      raise ActionController::RoutingError.new('URL origin not allowed')
    end

    begin
      uuid = /(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/.match(uri.path)[0]
    rescue NoMethodError
      raise ActionController::RoutingError.new('UUID not found in URL')
    end

    begin
      viz = CartoDB::Visualization::Member.new(id: uuid).fetch
    rescue KeyError
      raise ActionController::RoutingError.new('Visualization not found: ' + uuid)
    end

    protocol = force_https ? "https" : uri.scheme
    url = URI.join(public_visualizations_show_url(id: uuid, protocol: protocol) + "/", 'embed_map')
    html = "<iframe width='#{width}' height='#{height}' frameborder='0' src='#{url}' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>"

    response_data = {
        :type => 'rich',
        :version => '1.0',
        :width => width,
        :height => height,
        :title => viz.name,
        :html => html
    }

    if format == 'xml'
      render xml: response_data.to_xml(root: 'oembed')
    else
      render json: response_data.to_json
    end
  end
end
