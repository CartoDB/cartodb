
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

    uri = URI.parse(url)

    if uri.host != request.host
      raise ActionController::RoutingError.new('URL origin not allowed')
    end

    uuid = uri.path.split('/')[-1]
    begin
      viz = CartoDB::Visualization::Member.new(id: uuid).fetch
    rescue KeyError
      raise ActionController::RoutingError.new('Visualization not found: ' + uuid)
    end

    if uri.path =~ /^\/viz\/#{public_visualizations_show_path(id: uuid)}[\/]?$/
      raise ActionController::RoutingError.new('Wrong URL for visualization: ' + uuid)
    end

    url = File.join(url, 'embed_map')
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
