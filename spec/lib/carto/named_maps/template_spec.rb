# encoding utf-8

require_relative '../../../spec_helper_min.rb'
require_relative '../../../../lib/carto/named_maps/template'

module Carto
  module NamedMaps
    describe Template do
      include Carto::Factories::Visualizations

      before(:all) do
        bypass_named_maps
        @user = FactoryGirl.create(:carto_user, private_tables_enabled: true)

        @map, _, _, @visualization = create_full_visualization(@user)
      end

      describe '#name' do
        it 'should generate the template name correctly' do
          template = Carto::NamedMaps::Template.new(@visualization)
          template_name = template.to_hash[:name]

          template_name.should match("^#{Carto::NamedMaps::Template::NAME_PREFIX}")
          template_name.should_not match(/[^a-zA-Z0-9\-\_.]/)
        end
      end

      describe '#placeholders' do
        it 'should only generate placeholders for non-basemaps layers' do
          template = Carto::NamedMaps::Template.new(@visualization)
          placeholders = template.to_hash[:placeholders]
          placeholders.length.should be @map.layers.reject(&:basemap?).count
        end

        it 'should generate placeholders for data layers' do
          FactoryGirl.create(:carto_layer, maps: [@map])
          @map.save

          template = Carto::NamedMaps::Template.new(@visualization)
          placeholders = template.to_hash[:placeholders]

          placeholders.length.should be @map.layers.reject(&:basemap?).count
        end

        it 'should generate placeholders for torque layers' do
          FactoryGirl.create(:carto_layer, kind: 'torque', maps: [@map])
          @map.save

          template = Carto::NamedMaps::Template.new(@visualization)
          placeholders = template.to_hash[:placeholders]

          placeholders.length.should be @map.layers.reject(&:basemap?).count
        end
      end

      describe '#auth' do
        it 'should generate open auth for public, link and private visualizations' do
          @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN

          @visualization.privacy = Carto::Visualization::PRIVACY_LINK

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN

          @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN
        end

        it 'should use signed auth for password protected visualizations' do
          @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_SIGNED
        end

        it 'should use signed auth for organization private visualizations' do
          @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE

          @visualization.stubs(:organization?).returns(true)

          template = Carto::NamedMaps::Template.new(@visualization)
          template.to_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_SIGNED
        end
      end

      describe '#layergroup' do
        describe 'dataviews' do
          it 'should not add any dataview if no widgets are present' do
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:layergroup][:dataviews].should be_empty
          end

          it 'should add dataviews if widgets are present' do
            widget = FactoryGirl.create(:widget, layer: @map.data_layers.first)
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            dataviews = template_hash[:layergroup][:dataviews]

            dataviews.should_not be_empty

            template_widget = dataviews.first[widget.id.to_sym]
            template_widget.should_not be_nil

            template_widget[:type].should eq Carto::NamedMaps::Template::TILER_WIDGET_TYPES[widget.type]

            template_widget[:options].should eq widget.options.merge(aggregationColumn: nil)
          end
        end

        describe '#analyses' do
          it 'should not add any analysis if no analyses are present' do
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:layergroup][:analyses].should be_empty
          end

          it 'should add analyses if analyses are present' do
            analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
            @visualization.analyses << analysis
            @visualization.save

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:layergroup][:analyses].first.should eq analysis.analysis_definition
          end
        end
      end

      describe '#view' do
        before(:each) do
          @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
        end

        it 'should contain map zoom' do
          @template_hash[:view][:zoom].should eq @map.zoom
        end

        it 'should contain center' do
          map_center_data = @map.center_data
          template_center = @template_hash[:view][:center]

          template_center[:lat].should eq map_center_data[0].to_f
          template_center[:lng].should eq map_center_data[1].to_f
        end

        it 'should contain bounds' do
          @template_hash[:view][:bounds].should eq @map.view_bounds_data
        end
      end
    end
  end
end
