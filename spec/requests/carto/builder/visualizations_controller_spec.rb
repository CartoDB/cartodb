require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

describe Carto::Builder::VisualizationsController do
  include Warden::Test::Helpers

  include_context 'users helper'

  before(:all) do
    @user1.builder_enabled = true
    @user1.save
  end

  describe '#show' do
    before(:each) do
      map = FactoryGirl.create(:map, user_id: @user1.id)
      @visualization = FactoryGirl.create(:carto_visualization, user_id: @user1.id, map_id: map.id)
      @user1.stubs(:has_feature_flag?).with('new_geocoder_quota').returns(true)

      login(@user1)
    end

    it 'redirects to embed for non-editor users requests' do
      @user1.stubs(:builder_enabled).returns(false)

      get builder_visualization_url(id: @visualization.id)

      response.status.should eq 302
      response.location.should end_with builder_visualization_public_embed_path(visualization_id: @visualization.id)
    end

    it 'redirects to editor for vizjson2 visualizations' do
      @visualization.version = 2
      @visualization.save
      Carto::Visualization.any_instance.stubs(:uses_vizjson2?).returns(true)

      get builder_visualization_url(id: @visualization.id)

      response.status.should eq 302
      response.location.should include '/viz/' + @visualization.id
    end

    describe 'v2 -> v3 migration' do
      before(:each) do
        @visualization.version = 2
        @visualization.save
      end

      it 'automatically migrates visualizations' do
        get builder_visualization_url(id: @visualization.id)

        response.status.should eq 200
        @visualization.reload
        @visualization.version.should eq 3
      end

      it 'does not automatically migrates visualization with custom overlays' do
        @visualization.save
        @visualization.overlays.create(type: 'header')
        get builder_visualization_url(id: @visualization.id)

        response.status.should eq 200
        @visualization.reload
        @visualization.version.should eq 2
      end

      describe 'overlays' do
        it 'enables map layer_selector option if there is a layer_selector overlay' do
          @visualization.map.options[:layer_selector].should eq false
          @visualization.overlays << Carto::Overlay.new(type: 'layer_selector')

          get builder_visualization_url(id: @visualization.id)

          @visualization.reload.map.options[:layer_selector].should eq true
        end

        it 'removes layer selector overlays' do
          @visualization.overlays << Carto::Overlay.new(type: 'layer_selector')

          get builder_visualization_url(id: @visualization.id)

          @visualization.reload.overlays.any? { |o| o[:type] == 'layer_selector' }.should be_false
        end
      end
    end

    it 'returns 404 for non-existent visualizations' do
      get builder_visualization_url(id: UUIDTools::UUID.timestamp_create.to_s)

      response.status.should == 404
    end

    it 'returns 404 for non-derived visualizations' do
      @visualization.type = Carto::Visualization::TYPE_CANONICAL
      @visualization.save
      get builder_visualization_url(id: UUIDTools::UUID.timestamp_create.to_s)

      response.status.should == 404
    end

    it 'redirects to embed for visualizations not writable by user' do
      map = FactoryGirl.create(:map)
      @other_visualization = FactoryGirl.create(:carto_visualization, map_id: map.id)

      get builder_visualization_url(id: @other_visualization.id)

      response.status.should eq 302
      response.location.should end_with builder_visualization_public_embed_path(visualization_id: @other_visualization.id)
    end

    describe 'viewer users' do
      after(:each) do
        if @user1.viewer
          @user1.viewer = false
          @user1.save
        end
      end

      it 'redirected to embed for their visualizations at the builder' do
        @user1.viewer = true
        @user1.save

        get builder_visualization_url(id: @visualization.id)

        response.status.should eq 302
        response.location.should end_with builder_visualization_public_embed_path(visualization_id: @visualization.id)
      end
    end

    it 'returns visualization' do
      get builder_visualization_url(id: @visualization.id)

      response.status.should == 200
      response.body.should include(@visualization.id)
    end

    it 'does not show raster kind visualizations' do
      @visualization.kind = Carto::Visualization::KIND_RASTER
      @visualization.save

      get builder_visualization_url(id: @visualization.id)

      response.status.should == 404
    end

    it 'does not show slide type visualizations' do
      @visualization.type = Carto::Visualization::TYPE_SLIDE
      @visualization.save

      get builder_visualization_url(id: @visualization.id)

      response.status.should == 404
    end

    it 'defaults to generate vizjson with vector=false' do
      get builder_visualization_url(id: @visualization.id)

      response.status.should == 200
      response.body.should include('\"vector\":false')
    end

    it 'generates vizjson with vector=true with flag' do
      get builder_visualization_url(id: @visualization.id, vector: true)

      response.status.should == 200
      response.body.should include('\"vector\":true')
    end

    it 'displays analysesData' do
      analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user1.id)

      get builder_visualization_url(id: @visualization.id, vector: true)

      response.status.should == 200
      response.body.should include(analysis.natural_id)
    end
  end
end
