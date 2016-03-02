# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/api/json/layers_controller'
require_relative 'layers_controller_shared_examples'

describe Api::Json::LayersController do
  it_behaves_like 'layers controllers' do
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper

  include_context 'users helper'

  describe '#create' do
    before(:each) do
    end

    it 'creates layers' do
      kind = 'carto'
      expected_layer_without_id = { options: {}, kind: kind, infowindow: nil, tooltip: nil, order: 1 }

      layer_json = { kind: 'carto', options: {}, order: 1 }

      post_json api_v1_users_layers_create_url(
        user_domain: @user1.username,
        user_id: @user1.id,
        api_key: @user1.api_key), layer_json do |response|
        response.status.should eq 200
        layer = response.body

        layer[:id].should_not be_nil
        layer.delete(:id)
        layer.should eq expected_layer_without_id
      end
    end
  end
end
