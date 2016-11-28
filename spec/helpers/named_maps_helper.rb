module NamedMapsHelper
  def bypass_named_maps
    Carto::NamedMaps::Api.any_instance.stubs(show: nil, create: true, update: true, destroy: true)
  end

  def bypass_named_maps_requests
    mocked_response = mock
    mocked_response.stubs(code: 200, response_body: '{}')

    mocked_http_client = Carto::Http::Client.get('named_maps')
    mocked_http_client.stubs(:perform_request).returns(mocked_response)

    Carto::NamedMaps::Api.any_instance.stubs(http_client: mocked_http_client, show: nil)
  end
end
