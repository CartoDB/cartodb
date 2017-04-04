module MapsApiHelper
  def maps_api_template(privacy="private")
    maps_api = Cartodb.config[:tiler][privacy]
    if CartoDB.subdomainless_urls?
      maps_api["protocol"] + "://" + maps_api["domain"] + ":" + maps_api["port"].to_s + "/user/{user}"
    else
      maps_api["protocol"] + "://{user}." + maps_api["domain"] + ":" + maps_api["port"].to_s
    end
  end
end
