module MapsApiV2Helper
  def maps_api_v2_template
    maps_api_v2_url('{user}')
  end

  def maps_api_v2_url(username)
    maps_api_v2_url = Cartodb.get_config(:maps_api_v2, 'url')
    "#{maps_api_v2_url}/user/{user}" if maps_api_v2_url.present?
  end
end
