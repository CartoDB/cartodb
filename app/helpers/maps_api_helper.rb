module MapsApiHelper
  def maps_api_template(privacy = 'private')
    maps_api_url('{user}', privacy)
  end

  def maps_api_url(username, privacy = "private")
    maps_api = Cartodb.get_config(:tiler, privacy)
    if CartoDB.subdomainless_urls?
      maps_api["protocol"] + "://" + maps_api["domain"] + ":" + maps_api["port"].to_s + "/user/#{username}"
    else
      maps_api["protocol"] + "://#{username}." + maps_api["domain"] + ":" + maps_api["port"].to_s
    end
  end
end
