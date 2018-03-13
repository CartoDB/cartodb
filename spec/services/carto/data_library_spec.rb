require 'spec_helper_min'
require 'carto_api/json_client'
require 'carto/data_library_service'

describe Carto::DataLibraryService do
  include_context 'users helper'

  let(:visualization_json) do
    "{\"id\":\"b7aa989a-d7bb-11e4-a982-0e43f3deba5a\",\"name\":\"meta_dataset\",\"display_name\":null," +
      "\"attributions\":null,\"source\":\"\",\"license\":\"\",\"type\":\"table\",\"tags\":[\"production\"]" +
      ",\"description\":\"This must be PUBLIC for \\\"Public Library\\\" to work correctly\"," +
      "\"created_at\":\"2015-03-31T15:36:36+00:00\",\"updated_at\":\"2015-05-29T14:49:45+00:00\"," +
      "\"title\":\"\",\"kind\":\"geom\",\"privacy\":\"PUBLIC\",\"likes\":0,\"liked\":false," +
      "\"permission\":{\"id\":\"da9b55a8-65d2-42a7-b30a-9847805fcb99\"," +
      "\"owner\":{\"id\":\"891c95dc-b1f3-47d2-ace0-12651259b811\",\"username\":\"common-data\"," +
      "\"name\":\"\",\"last_name\":null," +
      "\"avatar_url\":\"//wadus.net/cartodbui/assets/unversioned/images/avatars/avatar_mountain_green.png\"," +
      "\"base_url\":\"https://common-data.carto.com\",\"google_maps_query_string\":\"\"," +
      "\"disqus_shortname\":\"\",\"viewer\":false,\"org_admin\":false,\"org_user\":false,\"remove_logo\":true}}," +
      "\"stats\":{\"2018-02-08\":0,\"2018-02-09\":0,\"2018-02-10\":0,\"2018-02-11\":0,\"2018-02-12\":0," +
      "\"2018-02-13\":0,\"2018-02-14\":0,\"2018-02-15\":0,\"2018-02-16\":0,\"2018-02-17\":0,\"2018-02-18\":0," +
      "\"2018-02-19\":0,\"2018-02-20\":0,\"2018-02-21\":0,\"2018-02-22\":0,\"2018-02-23\":0,\"2018-02-24\":0," +
      "\"2018-02-25\":0,\"2018-02-26\":1.0,\"2018-02-27\":0,\"2018-02-28\":0,\"2018-03-01\":0,\"2018-03-02\":0," +
      "\"2018-03-03\":0,\"2018-03-04\":0,\"2018-03-05\":0,\"2018-03-06\":0,\"2018-03-07\":0,\"2018-03-08\":0," +
      "\"2018-03-09\":0},\"auth_tokens\":[],\"table\":{\"id\":\"bf8fa9a0-2000-4682-8f32-2334f9882ca3\"," +
      "\"name\":\"\\\"public\\\".meta_dataset\",\"permission\":{\"id\":\"da9b55a8-65d2-42a7-b30a-9847805fcb99\"," +
      "\"owner\":{\"id\":\"891c95dc-b1f3-47d2-ace0-12651259b811\",\"username\":\"common-data\",\"name\":\"\"," +
      "\"last_name\":null,\"avatar_url\":\"//wadus.net/cartodbui/assets/images/avatars/avatar_mountain_green.png\"," +
      "\"base_url\":\"https://common-data.carto.com\",\"google_maps_query_string\":\"\"," +
      "\"disqus_shortname\":\"\",\"viewer\":false,\"org_admin\":false,\"org_user\":false,\"remove_logo\":true}}," +
      "\"geometry_types\":[\"ST_MultiPolygon\"],\"privacy\":\"PUBLIC\",\"updated_at\":\"2015-05-14T10:30:31+00:00\", " +
      "\"size\":53248,\"row_count\":124}}"
  end

  describe '#load_dataset' do
    it 'loads a remote dataset into a Data Library' do
      client_p = { scheme: 'https', base_domain: 'waduscarto.com', port: 666 }
      client = CartoAPI::JsonClient.new(**client_p)
      mocked_get_visualization_v1_response = JSON.parse(visualization_json)
      source_dataset = mocked_get_visualization_v1_response['name']
      params = {
        source_dataset: source_dataset,
        source_username: 'wadus-username',
        source_api_key: 'rewadus-api_key',
        target_username: @carto_user1.username,
        granted_api_key: 'wadus-api_key'
      }

      client.expects(:get_visualization_v1)
            .with(username: params[:source_username],
                  name: params[:source_dataset],
                  params: { api_key: params[:source_api_key] })
            .returns(mocked_get_visualization_v1_response)
      visualization = @carto_user1.visualizations
                                  .where(type: Carto::Visualization::TYPE_REMOTE)
                                  .where(name: source_dataset)
                                  .first
      visualization.should_not be

      Carto::DataLibraryService.new.load_dataset!(client, **params)

      visualization = @carto_user1.visualizations
                                  .where(type: Carto::Visualization::TYPE_REMOTE)
                                  .where(name: source_dataset)
                                  .first
      visualization.should be
      visualization.display_name.present?.should be_true # Data Library requires display name
      visualization.tags.should eq ['production']
      external_source = visualization.external_source
      external_source.should be
      import_url = "#{client_p[:scheme]}://#{params[:source_username]}.#{client_p[:base_domain]}"
      external_source.import_url.should start_with import_url
      external_source.geometry_types.should eq ['ST_MultiPolygon']

      visualization.destroy
    end
  end
end
