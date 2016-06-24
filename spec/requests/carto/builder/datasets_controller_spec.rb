require_relative '../../../spec_helper_min'

describe Carto::Builder::DatasetsController do
  include Warden::Test::Helpers

  describe '#show' do
    before(:all) do
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      @user = FactoryGirl.build(:valid_user).save
      @map = FactoryGirl.create(:carto_map, user_id: @user.id)
      @table = FactoryGirl.create(:carto_user_table, user_id: @user.id, map_id: @map)
      @visualization = FactoryGirl.create(:carto_visualization, type: Carto::Visualization::TYPE_CANONICAL,
                                                                user_id: @user.id, name: @table.name, map_id: @map.id)
    end

    before(:each) do
      @user.stubs(:has_feature_flag?).with('editor-3').returns(true)
      @user.stubs(:has_feature_flag?).with('new_geocoder_quota').returns(true)
      login(@user)
    end

    after(:all) do
      @visualization.destroy
      @table.destroy
      @map.destroy
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      @user.destroy
    end

    it 'returns 404 for non-editor users requests' do
      @user.stubs(:has_feature_flag?).with('editor-3').returns(false)

      get builder_dataset_url(id: @visualization.id)

      response.status.should == 404
    end

    it 'returns 404 for non-existent visualizations' do
      get builder_dataset_url(id: UUIDTools::UUID.timestamp_create.to_s)

      response.status.should == 404
    end

    it 'returns 403 for visualizations not writable by user' do
      @other_visualization = FactoryGirl.create(:carto_visualization, type: Carto::Visualization::TYPE_CANONICAL)

      get builder_dataset_url(id: @other_visualization.id)

      response.status.should == 403
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
  end
end
