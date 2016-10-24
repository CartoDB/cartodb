# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

describe Carto::Admin::BiVisualizationsController do
  include_context 'users helper'

  describe '#embed_map' do
    before(:all) do
      @bi_dataset = FactoryGirl.create(:bi_dataset, user_id: @user1.id)
      @bi_visualization = FactoryGirl.create(:bi_visualization, bi_dataset: @bi_dataset)
    end

    after(:all) do
      @bi_dataset.destroy
    end

    it 'returns 401 for non-authenticated requests' do
      get bi_visualizations_embed_map_url(user_domain: @user1.username,
                                          id: UUIDTools::UUID.timestamp_create.to_s), {}

      response.status.should == 401
    end

    it 'returns 404 for requests without matching bi_visualization' do
      get bi_visualizations_embed_map_url(user_domain: @user1.username,
                                          id: UUIDTools::UUID.timestamp_create.to_s,
                                          api_key: @user1.api_key), {}

      response.status.should == 404
    end

    it 'returns 400 for requests with a id not uuid' do
      get bi_visualizations_embed_map_url(user_domain: @user1.username,
                                          id: 'nouuid',
                                          api_key: @user1.api_key), {}

      response.status.should == 400
    end

    it 'returns the embed' do
      get bi_visualizations_embed_map_url(user_domain: @user1.username,
                                          id: @bi_visualization.id,
                                          api_key: @user1.api_key), {}

      response.status.should == 200
      response.body.should match /#{@bi_visualization.viz_json}/
    end

    it 'returns 403 if the vizjson does not belong to the user' do
      get bi_visualizations_embed_map_url(user_domain: @user2.username,
                                          id: @bi_visualization.id,
                                          api_key: @user2.api_key), {}

      response.status.should == 403
    end
  end
end
