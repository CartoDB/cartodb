module NamedMapsHelper

  def bypass_named_maps
    allow_any_instance_of(Carto::NamedMaps::Api).to receive(:show).and_return(nil)
    allow_any_instance_of(Carto::NamedMaps::Api).to receive(:create).and_return(true)
    allow_any_instance_of(Carto::NamedMaps::Api).to receive(:update).and_return(true)
    allow_any_instance_of(Carto::NamedMaps::Api).to receive(:destroy).and_return(true)
  end

  def bypass_named_maps_requests
    mocked_response = mock
    mocked_response.stubs(code: 200, response_body: '{}')

    mocked_http_client = Carto::Http::Client.get('named_maps')
    mocked_http_client.stubs(:perform_request).returns(mocked_response)

    allow_any_instance_of(Carto::NamedMaps::Api).to receive(:http_client).and_return(mocked_http_client)
    allow_any_instance_of(Carto::NamedMaps::Api).to receive(:show).and_return(nil)
  end

end
