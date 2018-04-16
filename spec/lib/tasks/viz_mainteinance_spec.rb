require 'spec_helper_min'
require 'rake'
require 'factories/carto_visualizations'

describe 'layers.rake' do
  include Carto::Factories::Visualizations

  describe '#sync_basemaps_from_app_config' do
    before(:all) do
      Rake.application.rake_require "tasks/viz_maintenance"
      Rake::Task.define_task(:environment)

      @user = FactoryGirl.create(:carto_user, private_maps_enabled: true)
    end

    before(:each) do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      @map2, @table2, @table_visualization2, @visualization2 = create_full_visualization(@user)
    end

    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      destroy_full_visualization(@map2, @table2, @table_visualization2, @visualization2)
    end

    after(:all) do
      ::User[@user.id].destroy
    end

    it 'deletes duplicated table visualizations' do
      map, table, table_visualization, visualization = create_full_visualization(@user)
      table_visualization.updated_at = @table_visualization.updated_at + 1.minute
      table_visualization.save(validate: false)
      table_visualization.update_column(:name, @table_visualization.name)

      Carto::Visualization.where(type: 'table').count.should eq 3
      Rake.application['cartodb:vizs:remove_dup_table_vizs'].invoke

      Carto::Visualization.where(type: 'table').count.should eq 2
      Carto::Visualization.find(table_visualization.id)
      Carto::Visualization.find(@table_visualization2)
      expect { Carto::Visualization.find(@table_visualization.id) }.to raise_error(ActiveRecord::RecordNotFound)

      destroy_full_visualization(map, table, table_visualization, visualization)
    end
  end
end
