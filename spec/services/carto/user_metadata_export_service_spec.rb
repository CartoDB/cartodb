require 'spec_helper_min'
require 'factories/carto_visualizations'

describe Carto::UserMetadataExportService do
  include NamedMapsHelper
  include Carto::Factories::Visualizations

  before(:all) do
    bypass_named_maps
    @user = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)

    @user.layers << FactoryGirl.create(:carto_tiled_layer)
    @user.assets << FactoryGirl.create(:carto_asset)
    @user.feature_flags << FactoryGirl.create(:carto_feature_flag)
  end

  after(:all) do
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    @user.destroy
  end

  it 'export + import' do
    ums = Carto::UserMetadataExportService.new
    export = ums.export_user_json_hash(@user.id)
    imported_user = ums.build_user_from_hash_export(export)

    expect(imported_user.layers.size).to eq 1
    expect(imported_user.assets.size).to eq 1
    expect(imported_user.feature_flags_user.size).to eq 1
  end
end
