
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

    raise ActionController::RoutingError.new('Incorrect width') if (width =~ /^[0-9]+(%|px)?$/).nil?
    raise ActionController::RoutingError.new('Incorrect height') if (height =~ /^[0-9]+(%|px)?$/).nil?

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
    
    fields = url_fields_from_fragments(url, force_https)

    # build the url using full schema because any visuaization should work with any user
    url = CartoDB.base_url(fields[:username], fields[:organization_name])  + public_visualizations_embed_map_path(id: uuid)
    # force the schema
    if fields[:protocol] == 'https' && !url.include?('https')
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
        :author_name => fields[:username],
        :author_url => fields[:user_profile_url],
        :provider_name => 'CartoDB',
        :provider_url => "#{fields[:protocol]}://www.cartodb.com/"
    }

    if format == 'xml'
      render xml: response_data.to_xml(root: 'oembed')
    else
      render json: response_data.to_json
    end
  end

  private

  def url_fields_from_fragments(url, force_https)
    uri = URI.parse(url)

    protocol = force_https ? "https" : uri.scheme

    # @see http://ruby-doc.org/stdlib-1.9.3/libdoc/uri/rdoc/URI.html#method-c-split
    url_data = URI.split(url)

    # url_data[5]: Path
    # url_data[2]: Host

    if url_data[5][0..2] == "/u/"
      username = url_data[5].split('/')[2]
      user_profile_url = "#{protocol}://#{url_data[2]}/u/#{username}"
      organization_name = url_data[2].split('.')[0]
    else
      username = url_data[2].split('.')[0]
      user_profile_url = "#{protocol}://#{url_data[2]}"
      organization_name = nil
    end

    # TODO: Support optional subdomains
#    if CartoDB.subdomains_optional?
      # both options
#    else
#      if CartoDB.subdomains_allowed?
#      else
#      end
#    end

    {
      organization_name: organization_name,
      username: username,
      user_profile_url: user_profile_url,
      protocol: protocol
    }
  end

  # https://cartodb.com/u/testuser/...
  def from_domainless_url(url_fragments, raise_on_error=true)
    # url_data[5]: Path
    if url_fragments[5][0..2] == "/u/"
      path_fragments = url_fragments[5].split('/')
      username = path_fragments[2]
      user_profile_url = "#{protocol}://#{url_fragments[2]}/u/#{username}"
      organization_name = url_fragments[2].sub(session_domain, '.').split
      organization_name = url_fragments[2].split('.')[0]
    else
      raise "URL needs username specified in the Path" if raise_on_error
    end
  end

end
