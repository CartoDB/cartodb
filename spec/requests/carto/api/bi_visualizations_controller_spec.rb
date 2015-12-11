# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

describe Carto::Api::BiVisualizationsController do
  include_context 'users helper'

  describe '#vizjson' do
    before(:all) do
      @bi_dataset = FactoryGirl.create(:bi_dataset, user_id: @user1.id)
      @bi_visualization = FactoryGirl.create(:bi_visualization, bi_dataset: @bi_dataset)
    end

    after(:all) do
      @bi_dataset.destroy
    end

    it 'returns 401 for non-authenticated requests' do
      get_json api_v1_bi_visualizations_vizjson_url(user_domain: @user1.username, id: UUIDTools::UUID.timestamp_create.to_s), {}, http_json_headers do |response|
        response.status.should == 401
      end
    end

    it 'returns 404 for requests without matching bi_visualization' do
      get_json api_v1_bi_visualizations_vizjson_url(user_domain: @user1.username, id: UUIDTools::UUID.timestamp_create.to_s, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 404
      end
    end

    it 'returns 400 for requests with a id not uuid' do
      get_json api_v1_bi_visualizations_vizjson_url(user_domain: @user1.username, id: 'nouuid', api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 400
      end
    end

    it 'returns the vizjson' do
      get_json api_v1_bi_visualizations_vizjson_url(user_domain: @user1.username, id: @bi_visualization.id, api_key: @user1.api_key), {}, http_json_headers do |response|
        response.status.should == 200
        response.body.should == @bi_visualization.viz_json_json
      end
    end

    it 'returns 403 if the vizjson does not belong to the user' do
      get_json api_v1_bi_visualizations_vizjson_url(user_domain: @user2.username, id: @bi_visualization.id, api_key: @user2.api_key), {}, http_json_headers do |response|
        response.status.should == 403
      end
    end
  end

  describe '#index' do
    before(:all) do
      @bi_dataset = FactoryGirl.create(:bi_dataset, user_id: @user1.id)
      @bi_visualization = FactoryGirl.create(:bi_visualization, bi_dataset: @bi_dataset)
    end

    after(:all) do
      @bi_dataset.destroy
    end

    it 'returns owned indexed bi_visualizations' do
      get_json api_v1_bi_visualizations_index_url(user_domain: @user1.username,
                                                  api_key: @user1.api_key),
               {},
               http_json_headers do |response|
        response.status.should == 200
        received_viz = response.body[:visualizations][0]['viz_json']

        received_viz.should eq Carto::Api::BiVisualizationPresenter.new(@bi_visualization).to_poro[:viz_json]
      end
    end

    it 'doesnt return non owned indexed bi_visualizations' do
      get_json api_v1_bi_visualizations_index_url(user_domain: @user2.username,
                                                  api_key: @user2.api_key),
               {},
               http_json_headers do |response|
        response.status.should == 200

        response.body[:total_entries].should eq 0
      end
    end
  end

  describe '#show' do
    before(:all) do
      @bi_dataset = FactoryGirl.create(:bi_dataset, user_id: @user1.id)
      @bi_visualization = FactoryGirl.create(:bi_visualization, bi_dataset: @bi_dataset)
    end

    after(:all) do
      @bi_dataset.destroy
    end

    it 'returns bi_visualization if authorized' do
      get_json api_v1_bi_visualizations_show_url(user_domain: @user1.username,
                                                 id: @bi_visualization.id,
                                                 api_key: @user1.api_key),
               {},
               http_json_headers do |response|
        response.status.should == 200
        received_viz = response.body[0].symbolize_keys

        received_viz[:id].should eq Carto::Api::BiVisualizationPresenter.new(@bi_visualization).to_poro[:id]
      end
    end

    it 'doesnt return bi_visualization if unauthorized' do
      get_json api_v1_bi_visualizations_show_url(user_domain: @user1.username,
                                                 id: @bi_visualization.id,
                                                 api_key: @user2.api_key),
               {},
               http_json_headers do |response|
        response.status.should == 401
      end
    end

    it 'returns 404 if bi_viz doesnt exist' do
      get_json api_v1_bi_visualizations_show_url(user_domain: @user1.username,
                                                 id: UUIDTools::UUID.timestamp_create.to_s,
                                                 api_key: @user1.api_key),
               {},
               http_json_headers do |response|
        response.status.should == 404
      end
    end
  end
end
