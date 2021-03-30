require 'spec_helper_min'

describe Carto::VisualizationBackupService do
  include Carto::Factories::Visualizations
  include Carto::VisualizationBackupService
  include_context 'user helper'

  describe '#create_visualization_backup' do
    before(:all) do
      @map = create(:carto_map_with_layers, user: @carto_user)
    end

    before(:each) do
      Carto::VisualizationBackup.all.map(&:destroy)
    end

    after(:each) do
      Carto::VisualizationBackup.all.map(&:destroy)
    end

    after(:all) do
      @map.destroy
    end

    it 'creates a backup with create_visualization_backup' do
      visualization = create(:carto_visualization, user: @carto_user, map: @map)

      Carto::VisualizationBackup.all.count.should eq 0

      create_visualization_backup(
        visualization: visualization,
        category: Carto::VisualizationBackup::CATEGORY_VISUALIZATION,
        with_mapcaps: true,
        with_password: true
      )

      Carto::VisualizationBackup.all.count.should eq 1

      backup = Carto::VisualizationBackup.where(visualization_id: visualization.id).first
      backup.should_not eq nil
      backup.user_id.should eq @carto_user.id
      backup.created_at.should_not eq nil
      backup.category.should eq Carto::VisualizationBackup::CATEGORY_VISUALIZATION
      backup.export.should_not be_empty
      backup.destroy

      visualization.destroy
    end

    it 'fails backup creation without visualization but not raises' do
      create_visualization_backup(
        visualization: nil,
        category: Carto::VisualizationBackup::CATEGORY_VISUALIZATION,
        with_mapcaps: true,
        with_password: true
      )

      Carto::VisualizationBackup.all.count.should eq 0
    end

    it 'fails backup creation without category but not raises' do
      visualization = create(:carto_visualization, user: @carto_user, map: @map)

      create_visualization_backup(
        visualization: visualization,
        category: nil,
        with_mapcaps: true,
        with_password: true
      )

      Carto::VisualizationBackup.all.count.should eq 0

      visualization.destroy
    end
  end

  describe '#create_visualization_backup' do
    before(:all) do
      @map = create(:carto_map_with_layers, user: @carto_user)
      Carto::VisualizationBackup.all.map(&:destroy)

      @visualization = create(:carto_visualization, user: @carto_user, map: @map)
      @visualization.destroy # creates a Visualization backup
    end

    after(:all) do
      @map.destroy
      Carto::VisualizationBackup.all.map(&:destroy)
    end

    it 'restores a visualization backup' do
      Carto::Visualization.where(user: @carto_user).count.should eq 0

      backup = Carto::VisualizationBackup.first
      visualization = restore_visualization_backup(backup.id)
      visualization.should_not eq nil
      visualization.id.should eq @visualization.id
      visualization.name.should eq @visualization.name
      visualization.type.should eq @visualization.type

      Carto::Visualization.where(user: @carto_user).count.should eq 1
    end

    it 'throws if the visualization already exists' do
      backup = Carto::VisualizationBackup.first
      restore_visualization_backup(backup.id)
      expect {
        restore_visualization_backup(backup.id)
      }.to raise_error('A visualization with the same id as the backup one already exists')
    end
  end
end
