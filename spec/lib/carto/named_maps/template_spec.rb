# encoding utf-8

require_relative '../../../spec_helper_min.rb'
require_relative '../../../../lib/carto/named_maps/template'

module Carto
  module NamedMaps
    describe Template do
      include Carto::Factories::Visualizations

      before(:each) do
        bypass_named_maps
      end

      before(:all) do
        @user = FactoryGirl.create(:carto_user, private_tables_enabled: true)

        @map, _, _, @visualization = create_full_visualization(@user)

        @map.layers.reject(&:basemap?).each(&:destroy)
        @map.reload
      end

      describe '#name' do
        it 'should generate the template name correctly' do
          template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
          template_name = template_hash[:name]

          template_name.should match("^#{Carto::NamedMaps::Template::NAME_PREFIX}")
          template_name.should_not match(/[^a-zA-Z0-9\-\_.]/)
        end
      end

      describe '#layers' do
        describe 'carto layers' do
          before(:all) do
            @carto_layer = FactoryGirl.create(:carto_layer, kind: 'carto', maps: [@map])
            @visualization.reload
          end

          after(:all) do
            @carto_layer.destroy
            @visualization.reload
          end

          it 'should generate placeholders' do
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:placeholders].length.should be @map.layers.reject(&:basemap?).count
          end

          describe 'with analyses' do
            before(:all) do
              @carto_layer = FactoryGirl.create(:carto_layer, kind: 'carto', maps: [@map])
              @analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
              @visualization.reload

              @carto_layer.options[:source] = @analysis.natural_id
              @carto_layer.save

              @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            end

            after(:all) do
              @analysis.destroy
              @carto_layer.destroy
              @visualization.reload
              @template_hash = nil
            end

            it 'should not contain sql' do
              @template_hash[:layergroup][:layers].second[:options][:sql].should be_nil
            end

            it 'should contain source' do
              @template_hash[:layergroup][:layers].second[:options][:source][:id].should eq @analysis.natural_id
            end
          end

          describe 'with no analyses' do
            before(:all) do
              @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            end

            after(:all) do
              @template_hash = nil
            end

            it 'should contain sql' do
              @template_hash[:layergroup][:layers].second[:options].should_not be_nil
            end

            it 'should not contain source' do
              @template_hash[:layergroup][:layers].second[:options][:source].should be_nil
            end
          end
        end

        describe 'torque layers' do
          before(:all) do
            @torque_layer = FactoryGirl.create(:carto_layer, kind: 'torque', maps: [@map])
            @visualization.reload
          end

          after(:all) do
            @torque_layer.destroy
            @visualization.reload
          end

          it 'should generate placeholders' do
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:placeholders].length.should be @map.layers.reject(&:basemap?).count
          end
        end

        describe 'basemap layers' do
          before(:all) do
            @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
          end

          after(:all) do
            @template_hash = nil
          end

          it 'should not generate placeholders' do
            @template_hash[:placeholders].length.should be 0
          end

          it 'should not have sql' do
            @template_hash[:layergroup][:layers].first[:options][:sql].should be_nil
          end

          it 'should not have sql wrap' do
            @template_hash[:layergroup][:layers].first[:options][:sql_wrap].should be_nil
          end

          it 'should not have source' do
            @template_hash[:layergroup][:layers].first[:options][:source].should be_nil
          end
        end
      end

      describe '#auth' do
        describe 'should be open' do
          after(:each) do
            @visualization.save

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            template_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN
          end

          it 'for public visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC
          end

          it 'for private visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
          end

          it 'for link visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_LINK
          end
        end

        describe 'should be signed' do
          after(:each) do
            @visualization.save

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            template_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_SIGNED
          end

          it 'for password protected visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
          end

          it 'for organization private visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
            @visualization.stubs(:organization?).returns(true)
          end
        end
      end

      describe '#layergroup' do
        describe 'dataviews' do
          before(:all) do
            @carto_layer = FactoryGirl.create(:carto_layer, kind: 'carto', maps: [@map])
            @visualization.reload
          end

          after(:all) do
            @carto_layer.destroy
            @visualization.reload
          end

          it 'should not add any dataview if no widgets are present' do
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:layergroup][:dataviews].should be_empty
          end

          it 'should add dataviews if widgets are present' do
            widget = FactoryGirl.create(:widget, layer: @carto_layer)
            @visualization.reload

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            dataviews = template_hash[:layergroup][:dataviews]

            dataviews.should_not be_empty

            template_widget = dataviews.first[widget.id.to_sym]
            template_widget.should_not be_nil

            template_widget[:type].should eq Carto::NamedMaps::Template::TILER_WIDGET_TYPES[widget.type]

            template_widget[:options].should eq widget.options.merge(aggregationColumn: nil)

            widget.destroy
            @visualization.reload
          end
        end

        describe '#analyses' do
          it 'should not add any analysis if no analyses are present' do
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:layergroup][:analyses].should be_empty
          end

          it 'should add analyses if analyses are present' do
            analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
            @visualization.reload

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:layergroup][:analyses].first.should_not be_nil
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
