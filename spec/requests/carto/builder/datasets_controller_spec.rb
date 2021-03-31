require_relative '../../../spec_helper'

describe Carto::Builder::DatasetsController do
  include Warden::Test::Helpers

  describe '#show' do
    before(:all) do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      bypass_named_maps
      @user = build(:valid_user, builder_enabled: true).save
      @table = create(:carto_user_table, :full, user_id: @user.id, map: @map)
      @map = @table.map
      @visualization = @table.table_visualization
    end

    before(:each) do
      login(@user)
    end

    after(:all) do
      @visualization.destroy
      @table.destroy
      @map.destroy
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      @user.destroy
      @feature_flag.destroy
    end

    it 'redirects to public view non-builder users requests' do
      @user.stubs(:builder_enabled).returns(false)

      get builder_dataset_url(id: @visualization.id)

      response.status.should eq 302
      response.location.should end_with public_table_map_path(id: @visualization.id)
    end

    it 'returns 404 for non-existent visualizations' do
      get builder_dataset_url(id: Carto::UUIDHelper.random_uuid)

      response.status.should == 404
    end

    it 'redirects to public view for visualizations not writable by user' do
      bypass_named_maps
      @other_visualization = create(:carto_visualization, type: Carto::Visualization::TYPE_CANONICAL)

      get builder_dataset_url(id: @other_visualization.id)

      response.status.should eq 302
      response.location.should end_with public_table_map_path(id: @other_visualization.id)
    end

    it 'returns visualization' do
      get builder_dataset_url(id: @visualization.id)

      response.status.should == 200
      response.body.should include(@visualization.id)
    end

    it 'does not show derived visualizations' do
      Carto::Visualization.any_instance.stubs(:type).returns(Carto::Visualization::TYPE_DERIVED)

      get builder_dataset_url(id: @visualization.id)

      response.status.should == 404
    end

    it 'does not show raster visualizations' do
      Carto::Visualization.any_instance.stubs(:kind).returns(Carto::Visualization::KIND_RASTER)

      get builder_dataset_url(id: @visualization.id)

      response.status.should == 404
    end

    it 'does not include google maps if not configured' do
      @map.provider = 'googlemaps'
      @map.save
      @user.google_maps_key = ''
      @user.save
      get builder_dataset_url(id: @visualization.id)

      response.status.should == 200
      response.body.should_not include("maps.google.com/maps/api/js")
    end

    it 'includes the google maps client id if configured' do
      @map.provider = 'googlemaps'
      @map.save
      @user.google_maps_key = 'client=wadus_cid'
      @user.save
      get builder_dataset_url(id: @visualization.id)

      response.status.should == 200
      response.body.should include("maps.googleapis.com/maps/api/js?v=3.32&client=wadus_cid")
    end

    it 'does not include google maps if the map does not need it' do
      @map.provider = 'leaflet'
      @map.save
      @user.google_maps_key = 'client=wadus_cid'
      @user.save
      get builder_dataset_url(id: @visualization.id)

      response.status.should == 200
      response.body.should_not include("maps.googleapis.com/maps/api/js")
    end
  end
end
