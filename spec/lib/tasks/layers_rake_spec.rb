require 'spec_helper_unit'
require 'factories/carto_visualizations'

describe 'layers.rake' do
  include Carto::Factories::Visualizations

  describe '#sync_basemaps_from_app_config' do
    before do
      Rake.application.rake_require 'tasks/layers'
      Rake::Task.define_task(:environment)
      @user = create(:carto_user, private_maps_enabled: true)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    end

    after { Rake::Task['carto:db:sync_basemaps_from_app_config'].reenable }

    it 'updates single layers' do
      class_name = @visualization.user_layers.sort_by(&:order).first.options['className']

      Cartodb.with_config(basemaps: { 'CARTO' => { class_name => { 'className' => class_name, 'dummy' => 'opt' } } }) do
        Rake::Task['carto:db:sync_basemaps_from_app_config'].invoke
      end

      @visualization.reload
      expect(@visualization.user_layers.first.options).to eq('className' => class_name, 'dummy' => 'opt')
    end

    it 'updates sandwiched layers' do
      class_name = @table_visualization.user_layers.sort_by(&:order).first.options['className']

      dummy_options = {
        'className' => class_name,
        'dummy' => 'opt',
        'name' => 'X',
        'labels' => {
          'dummy' => 'label'
        }
      }

      Cartodb.with_config(basemaps: { 'CARTO' => { class_name => dummy_options } }) do
        Rake::Task['carto:db:sync_basemaps_from_app_config'].invoke
      end

      @table_visualization.reload
      bottom_layer, labels_layer = @table_visualization.user_layers.sort_by(&:order)
      expect(bottom_layer.options).to eq(dummy_options)
      expect(labels_layer.options).to eq('dummy' => 'label', 'name' => 'X Labels', 'type' => 'Tiled')
    end

    it 'updates mapcaps' do
      class_name = @visualization.user_layers.sort_by(&:order).first.options['className']
      @visualization.create_mapcap!

      Cartodb.with_config(basemaps: { 'CARTO' => { class_name => { 'className' => class_name, 'dummy' => 'opt' } } }) do
        Rake::Task['carto:db:sync_basemaps_from_app_config'].invoke
      end

      @visualization.reload
      mapcapped_layer = @visualization.mapcaps.first.regenerate_visualization.user_layers.first.options
      expect(mapcapped_layer).to eq('className' => class_name, 'dummy' => 'opt')
    end

    describe 'for viewer users' do
      before do
        @user.viewer = true
        @user.save
      end

      it 'updates layers for viewer users' do
        class_name = @table_visualization.user_layers.sort_by(&:order).first.options['className']

        dummy_options = {
          'className' => class_name,
          'dummy' => 'opt',
          'name' => 'X',
          'labels' => {
            'dummy' => 'label'
          }
        }

        Cartodb.with_config(basemaps: { 'CARTO' => { class_name => dummy_options } }) do
          Rake::Task['carto:db:sync_basemaps_from_app_config'].invoke
        end

        @table_visualization.reload
        bottom_layer, labels_layer = @table_visualization.user_layers.sort_by(&:order)
        expect(bottom_layer.options).to eq(dummy_options)
        expect(labels_layer.options).to eq('dummy' => 'label', 'name' => 'X Labels', 'type' => 'Tiled')

        @user.reload
        expect(@user.viewer).to be_true
      end
    end

    it 'doesn\'t touch unknown layers' do
      base_layer = @visualization.user_layers.first
      base_layer.options['className'] = 'something_custom'
      base_layer.save!

      Rake::Task['carto:db:sync_basemaps_from_app_config'].invoke

      expect { base_layer.reload }.not_to(change { base_layer.options })
    end

    it 'doesn\'t touch non-tiled layers' do
      base_layer = @visualization.user_layers.first
      base_layer.kind = 'background'
      base_layer.save!

      Rake::Task['carto:db:sync_basemaps_from_app_config'].invoke

      expect { base_layer.reload }.not_to(change { base_layer.options })
    end
  end
end
