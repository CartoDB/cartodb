# encoding: utf-8

require_relative '../../spec_helper'

describe Carto::VisualizationsExportService do
  before(:each) do
    bypass_named_maps
    ::User.any_instance
          .stubs(:has_feature_flag?)
          .with(Carto::VisualizationsExportService::FEATURE_FLAG_NAME)
          .returns(true)
  end

  after(:each) do
    Carto::VisualizationBackup.delete_all
  end

  it "Calls data export upon visualization deletion" do
    visualization = create_vis($user_1)

    Carto::VisualizationsExportService.any_instance
                                      .expects(:export)
                                      .with(visualization.id)
                                      .returns(true)

    visualization.delete
  end

  it "Exports data to DB" do
    visualization = create_vis($user_1)

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
    visualization = create_vis($user_1)
    visualization.delete
    visualization = create_vis($user_1)
    visualization.delete
    visualization = create_vis($user_1)
    visualization.delete

    old_date = Date.today - (Carto::VisualizationsExportService::DAYS_TO_KEEP_BACKUP * 2).days
    Carto::VisualizationBackup.update_all "created_at='#{old_date}'"

    purged_items = Carto::VisualizationsExportService.new.purge_old

    purged_items.should eq 3
    Carto::VisualizationBackup.where(username: $user_1.username).count.should eq 0
  end

  private

  def create_vis(user, attributes = {})
    attrs = {
      user_id:                  user.id,
      name:                     attributes.fetch(:name, "visualization #{rand(9999)}"),
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
