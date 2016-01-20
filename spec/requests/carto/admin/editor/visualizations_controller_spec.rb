require_relative '../../../../spec_helper'
require_relative '../../../../factories/users_helper'

describe Carto::Editor::VisualizationsController do
  include Warden::Test::Helpers

  include_context 'users helper'

  describe '#show' do
    before(:all) do
      @visualization = FactoryGirl.create(:carto_visualization)
      @user1.stubs(:has_feature_flag?).with('editor-3') { true }

      login(@user1)
    end

    it 'returns 404 for non-editor users requests' do
      @user1.stubs(:has_feature_flag?).with('editor-3') { false }
      get visualization_url(user_domain: @user1.username, id: @visualization.id), {} do |response|
        response.status.should == 404
      end
    end

    it 'returns 404 for non-existent visualizations' do
      get visualization_url(user_domain: @user1.username, id: UUIDTools::UUID.timestamp_create.to_s), {} do |response|
        response.status.should == 404
      end
    end

    it 'returns visualization' do
      get visualization_url(user_domain: @user1.username, id: @visualization.id), {} do |response|
        response.status.should == 200
      end
    end

    it 'does not show raster kind visualizations' do
      @raster_visualization = FactoryGirl.create(:carto_visualization)
      @raster_visualization.kind = Carto::Visualization::KIND_RASTER

      get visualization_url(user_domain: @user1.username, id: @visualization.id), {} do |response|
        response.status.should == 404
      end
    end

    it 'does not show slide type visualizations' do
      @raster_visualization = FactoryGirl.create(:carto_visualization)
      @raster_visualization.stubs(:type_slide?) { true }

      get visualization_url(user_domain: @user1.username, id: @visualization.id), {} do |response|
        response.status.should == 404
      end
    end
  end
end
