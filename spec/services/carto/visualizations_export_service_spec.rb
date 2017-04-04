# encoding: utf-8

require_relative '../../spec_helper'
require 'helpers/unique_names_helper'
require 'visualization/vizjson'

describe Carto::VisualizationsExportService do
  include UniqueNamesHelper
  before(:all) do
    @user = FactoryGirl.create(:valid_user, private_tables_enabled: true)
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    bypass_named_maps
    ::User.any_instance
      .stubs(:has_feature_flag?)
      .returns(false)
    ::User.any_instance
      .stubs(:has_feature_flag?)
      .with(Carto::VisualizationsExportService::FEATURE_FLAG_NAME)
      .returns(true)
  end

  after(:each) do
    Carto::VisualizationBackup.delete_all
  end

  it "Calls data export upon visualization deletion" do
    visualization = create_vis(@user)

    Carto::VisualizationsExportService.any_instance
                                      .expects(:export)
                                      .with(visualization.id)
                                      .returns(true)

    visualization.delete
  end

  it "Exports data to DB" do
    visualization = create_vis(@user)

    visualization_clone = visualization.dup

    visualization.delete

    backup = Carto::VisualizationBackup.where(visualization: visualization_clone.id).first
    backup.should_not eq nil
    backup.visualization.should eq visualization_clone.id
    backup.username.should eq visualization_clone.user.username
    backup.export_vizjson.should_not eq nil
    backup.export_vizjson.should_not eq ""
  end

  it "Purges old backup entries when told to do so" do
    visualization = create_vis(@user)
    visualization.delete
    visualization = create_vis(@user)
    visualization.delete
    visualization = create_vis(@user)
    visualization.delete

    old_date = Date.today - (Carto::VisualizationsExportService::DAYS_TO_KEEP_BACKUP * 2).days
    Carto::VisualizationBackup.update_all "created_at='#{old_date}'"

    purged_items = Carto::VisualizationsExportService.new.purge_old

    purged_items.should eq 3
    Carto::VisualizationBackup.where(username: @user.username).count.should eq 0
  end

  it "Deletes backup after successfully restoring" do
    visualization = create_vis(@user)

    visualization_clone = visualization.dup

    visualization.delete

    result = Carto::VisualizationsExportService.new.import(visualization_clone.id)
    result.should eq true

    expect {
      Carto::VisualizationsExportService.new.import(visualization_clone.id)
    }.to raise_error Carto::VisualizationsExportServiceError

    Carto::VisualizationBackup.where(visualization: visualization_clone.id).count.should eq 0
  end

  it "Imports data from DB" do
    table_1 = create_table(user_id: @user.id)
    table_2 = create_table(user_id: @user.id)

    blender = Visualization::TableBlender.new(Carto::User.find(@user.id), [table_1, table_2])
    map = blender.blend

    visualization = create_vis(@user, map_id: map.id, description: 'description <strong>with tags</strong>')

    # Keep data for later comparisons
    base_layer = visualization.layers(:base).first
    visualization_clone = visualization.dup

    original_data_layer_names = visualization.layers(:data).map { |layer| layer.options["table_name"] }

    # As duplicating the vis only works fine with parent object, store also the vizjson for comparisons
    vizjson_options = {
      full: true,
      user_name: visualization.user.username,
      user_api_key: visualization.user.api_key,
      user: visualization.user,
      viewer_user: visualization.user
    }
    original_vizjson = CartoDB::Visualization::VizJSON.new(
      Carto::Api::VisualizationVizJSONAdapter.new(visualization, $tables_metadata), vizjson_options, Cartodb.config)
                                                      .to_poro
                                                      .to_json
    original_vizjson = ::JSON.parse(original_vizjson)

    visualization.delete

    Carto::VisualizationsExportService.new.import(visualization_clone.id)

    # Restore maintains same visualization UUID
    restored_visualization = CartoDB::Visualization::Member.new(id: visualization_clone.id).fetch
    restored_visualization.nil?.should eq false

    # Can reuse same vizjson options
    restored_vizjson = CartoDB::Visualization::VizJSON.new(
      Carto::Api::VisualizationVizJSONAdapter.new(restored_visualization, $tables_metadata),
      vizjson_options, Cartodb.config)
                                                      .to_poro
                                                      .to_json
    restored_vizjson = ::JSON.parse(restored_vizjson)

    restored_data_layer_names = visualization.layers(:data).map { |layer| layer.options["table_name"] }

    # Base attributes checks
    restored_visualization.name.should eq visualization_clone.name
    restored_visualization.description.should eq visualization_clone.description
    restored_visualization.privacy.should eq CartoDB::Visualization::Member::PRIVACY_LINK
    # Vizjson checks
    restored_vizjson['map_provider'].should eq original_vizjson['map_provider']
    restored_vizjson['bounds'].should eq original_vizjson['bounds']
    restored_vizjson['center'].should eq original_vizjson['center']
    restored_vizjson['zoom'].should eq original_vizjson['zoom']
    restored_vizjson['overlays'].should eq original_vizjson['overlays']

    restored_layer_ids = restored_vizjson["layers"].map { |l| l['id'] }
    original_layer_ids = original_vizjson["layers"].map { |l| l['id'] }

    # Restoring doesn't keep layer ids (restored layers are stored in the same table)
    restored_layer_ids.count.should == original_layer_ids.count
    restored_layer_ids.compact.sort.should_not == original_layer_ids.compact.sort

    restored_named_map = restored_vizjson["layers"][1]["options"]["named_map"]
    original_named_map = original_vizjson["layers"][1]["options"]["named_map"]
    restored_named_map_layer_ids = restored_named_map['layers'].map { |l| l['id'] }
    original_named_map_layer_ids = original_named_map['layers'].map { |l| l['id'] }
    # Restoring doesn't keep layer ids (restored layers are stored in the same table)
    restored_named_map_layer_ids.count.should == original_named_map_layer_ids.count
    restored_named_map_layer_ids.compact.sort.should_not == original_named_map_layer_ids.compact.sort


    # Clear layer named map layers ids
    restored_named_map["layers"].each { |l| l['id'] = nil }
    original_named_map["layers"].map { |l| l['id'] = nil }
    (restored_named_map["layers"] -
     original_named_map["layers"]).should eq []

    # Layer checks
    (restored_visualization.layers(:base).count > 0).should eq true
    restored_visualization.layers(:base).first["options"].should eq base_layer["options"]
    restored_visualization.layers(:data).count.should eq 2
    (restored_data_layer_names - original_data_layer_names).should eq []
  end

  it "Doesn't imports when versioning changes except if forced" do
    stubbed_version = -1
    Carto::VisualizationsExportService.any_instance.stubs(:export_version).returns(stubbed_version)

    visualization = create_vis(@user)
    visualization_id = visualization.id
    visualization.delete

    Carto::VisualizationsExportService.any_instance.unstub(:export_version)

    export_service = Carto::VisualizationsExportService.new

    version = export_service.send (:export_version)

    expect {
      export_service.import(visualization_id)
    }.to raise_exception Carto::VisualizationsExportServiceError,
                         "Stored data has different version (#{stubbed_version}) than Service (#{version})"

    result = export_service.import(visualization_id, true)
    result.should eq true
  end

  private

  def create_vis(user, attributes = {})
    attrs = {
      user_id:                  user.id,
      name:                     attributes.fetch(:name, unique_name('viz')),
      map_id:                   attributes.fetch(:map_id, ::Map.create(user_id: user.id).id),
      description:              attributes.fetch(:description, 'bogus'),
      type:                     attributes.fetch(:type, 'derived'),
      privacy:                  attributes.fetch(:privacy, 'public')
    }

    vis = CartoDB::Visualization::Member.new(attrs)
    vis.store

    vis
  end
end
