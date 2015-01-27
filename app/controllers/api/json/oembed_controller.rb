
# encoding: utf-8

class Api::Json::OembedController < Api::ApplicationController
  include CartoDB

  # Fetch info from the current user orgranization
  def show
    url = params[:url]
    url += '/embed_map'
    html = "<iframe width='100%' height='520' frameborder='0' src='#{url}' allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>"
    render json: {
      :type => 'url',
      :html => html
    }.to_json
  end


end
