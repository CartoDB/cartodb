module NamedMapsHelper
  def bypass_named_maps
    allow_any_instance_of(Carto::NamedMaps::Api).to receive(show: nil, create: true, update: true, destroy: true)
  end

  def bypass_named_maps_requests
    mocked_response = double
    allow(mocked_response).to receive_messages(code: 200, response_body: '{}')

    mocked_http_client = Carto::Http::Client.get('named_maps')
    allow(mocked_http_client).to receive(:perform_request).and_return(mocked_response)

    allow_any_instance_of(Carto::NamedMaps::Api).to receive(http_client: mocked_http_client, show: nil)
  end
end
