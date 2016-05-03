# encoding: utf-8
require 'spec_helper_min'
require_dependency 'carto/uuidhelper'
require 'factories/carto_visualizations'
require 'support/helpers'

describe Carto::Api::VisualizationExportsController do
  include Carto::UUIDHelper
  include Carto::Factories::Visualizations
  include HelperMethods

  describe '#create' do
    before(:all) do
      @user = FactoryGirl.create(:carto_user, private_maps_enabled: true)
      @user2 = FactoryGirl.create(:carto_user, private_maps_enabled: true)
    end

    before(:each) do
      bypass_named_maps
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      carto_layer = @visualization.layers.find { |l| l.kind == 'carto' }
      carto_layer.options[:user_name] = @user.username
      carto_layer.save
    end

    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    after(:all) do
      # This avoids connection leaking.
      ::User[@user.id].destroy
      ::User[@user2.id].destroy
    end

    def create_visualization_export_url(user)
      visualization_exports_url(user_domain: user.username, api_key: user.api_key)
    end

    it 'returns 404 for nonexisting visualizations' do
      post_json create_visualization_export_url(@user), visualization_id: random_uuid do |response|
        response.status.should eq 404
      end
    end

    it 'returns 403 for non accessible visualizations' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
      @visualization.save

      post_json create_visualization_export_url(@user2), visualization_id: @visualization.id do |response|
        response.status.should eq 403
      end
    end

    it 'enqueues a job and returns the id' do
      Resque.expects(:enqueue).with(Resque::ExporterJobs, anything).once
      post_json create_visualization_export_url(@user), visualization_id: @visualization.id do |response|
        response.status.should eq 201
        visualization_export_id = response.body[:id]
        visualization_export_id.should_not be_nil
        visualization_export = Carto::VisualizationExport.find(visualization_export_id)
        visualization_export.visualization_id.should eq @visualization.id
        visualization_export.user_id.should eq @user.id
        visualization_export.state.should eq Carto::VisualizationExport::STATE_PENDING
      end
    end
  end
end
