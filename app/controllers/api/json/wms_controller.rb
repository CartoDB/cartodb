require 'uri'
require 'json'
require_relative '../../../../services/wms/proxy'

class Api::Json::WmsController < Api::ApplicationController
  ssl_required :index
  ssl_allowed :proxy

  def proxy
    proxy = CartoDB::WMS::Proxy.new(params.fetch(:url))
    render_jsonp(proxy.serialize)
  rescue URI::InvalidURIError => exception
    render_jsonp({ errors: "Couldn't load URL" }, 400)
  end
end

