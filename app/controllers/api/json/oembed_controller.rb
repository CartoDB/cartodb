
# encoding: utf-8

require 'uri'

class Api::Json::OembedController < Api::ApplicationController
  include CartoDB

  skip_before_filter :api_authorization_required

  # Returns oembed data as required
  def show
    url = params[:url]
    width = params[:maxwidth] || '100%'
    height = params[:maxheight] || '520px'
    format = request.query_parameters[:format]
    force_https = true if params[:allow_http].nil?

    if (width =~ /^[0-9]+(%|px)?$/) == nil
      raise ActionController::RoutingError.new('Incorrect width')
    end
    if (height =~ /^[0-9]+(%|px)?$/) == nil
      raise ActionController::RoutingError.new('Incorrect height')
    end

    uri = URI.parse(url)

    begin
      uuid = /(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/.match(uri.path)[0]
    rescue NoMethodError
      raise ActionController::RoutingError.new('UUID not found in URL')
    end

    begin
      viz = CartoDB::Visualization::Member.new(id: uuid).fetch
    rescue KeyError
      name = ''
    else
      name = viz.name
    end
    
    protocol = force_https ? "https" : uri.scheme

    url_data = URI.split(url)
    organization = nil
    if url_data[5][0..2] == "/u/"
      user = url_data[5].split('/')[2]
      user_profile = "#{protocol}://#{url_data[2]}/u/#{user}"
      organization = url_data[2].split('.')[0]
    else
      user = url_data[2].split('.')[0]
      user_profile = "#{protocol}://#{url_data[2]}"
    end

    # build the url using full schema because any visuaization should work with any user
    url = CartoDB.user_url(user, organization)  + public_visualizations_show_path(id: uuid)
    # force the schema
    if protocol == 'https' && !url.include?('https')
      url = url.sub('http', 'https')
    end

    html = "<iframe width='#{width}' height='#{height}' frameborder='0' src='#{url}' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>"

    response_data = {
        :type => 'rich',
        :version => '1.0',
        :width => width,
        :height => height,
        :title => name,
        :html => html,
        :author_name => user,
        :author_url => user_profile,
        :provider_name => 'CartoDB',
        :provider_url => "#{protocol}://www.cartodb.com/"
    }

    if format == 'xml'
      render xml: response_data.to_xml(root: 'oembed')
    else
      render json: response_data.to_json
    end
  end
end
