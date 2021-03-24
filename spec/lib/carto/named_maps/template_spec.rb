require_relative '../../../spec_helper_min'
require_relative '../../../../lib/carto/named_maps/template'

module Carto
  module NamedMaps
    describe Template do
      include Carto::Factories::Visualizations

      before(:each) do
        bypass_named_maps
      end

      before(:all) do
        @user = create(:carto_user, private_tables_enabled: true, private_maps_enabled: true)

        @map, _, _, @visualization = create_full_visualization(@user)

        @map.layers.reject(&:basemap?).each(&:destroy)
        @map.reload
      end

      describe '#to_hash' do
        after(:all) do
          destroy_full_visualization(@map1, @table1, @table_visualization1, @visualization1)
        end

        it 'should get view info from the map when the state center does not exist' do
          @map1, @table1, @table_visualization1, @visualization1 = create_full_visualization(@user)
          @visualization1.state = create(:state, visualization: @visualization1)
          @visualization1.state.json[:map].delete(:center)
          template_hash = Carto::NamedMaps::Template.new(@visualization1).to_hash
          template_hash[:view][:center].values.reverse.should eq @visualization1.map.center_data.map(&:to_f)
        end
      end

      describe '#name' do
        it 'should generate the template name correctly' do
          template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
          template_name = template_hash[:name]

          template_name.should match("^#{Carto::NamedMaps::Template::NAME_PREFIX}")
          template_name.should_not match(/[^a-zA-Z0-9\-\_.]/)
        end
      end

      it 'should have correct Named Maps version' do
        template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

        template_hash[:version].should eq Carto::NamedMaps::Template::NAMED_MAPS_VERSION
      end

      describe '#layers' do
        describe 'carto layers' do
          before(:all) do
            @carto_layer = create(:carto_layer, kind: 'carto', maps: [@map])
            @visualization.reload

            @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
          end

          after(:all) do
            @carto_layer.destroy
            @visualization.reload

            @template_hash = nil
          end

          it 'should generate placeholders' do
            @template_hash[:placeholders].length.should be @map.layers.reject(&:basemap?).count
          end

          it 'should have options' do
            @template_hash[:layergroup][:layers].second[:options].should_not be_nil
          end

          it 'should be cartodb type' do
            @template_hash[:layergroup][:layers].second[:type].should eq 'cartodb'
          end

          it 'should contain layer id' do
            @template_hash[:layergroup][:layers].second[:id].should_not be_nil
            @template_hash[:layergroup][:layers].second[:id].should eq @carto_layer.id
          end

          describe 'with popups' do
            let(:dummy_infowindow) do
              {
                "fields" => [
                  {
                    "name" => "click_status",
                    "title" => true,
                    "position" => 8
                  }],
                "template_name" => "table/views/infowindow_light",
                "template" => "",
                "alternative_names" => {},
                "width" => 226,
                "maxHeight" => 180
              }
            end

            let(:dummy_tooltip) do
              {
                "fields" => [
                  {
                    "name" => "hover_status",
                    "title" => true,
                    "position" => 8
                  }],
                "template_name" => "table/views/infowindow_light",
                "template" => "",
                "alternative_names" => {},
                "width" => 226,
                "maxHeight" => 180
              }
            end

            before(:all) do
              @carto_layer.options[:interactivity] = 'cartodb_id,click_status'
              @carto_layer.save

              @visualization.reload
            end

            after(:all) do
              @carto_layer.options[:interactivity] = nil
              @carto_layer.save

              @visualization.reload
            end

            describe 'triggered on hover only' do
              before(:all) do
                @carto_layer.tooltip = dummy_tooltip
                @carto_layer.save

                @visualization.reload

                template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
                @layer_options_hash = template_hash[:layergroup][:layers].second[:options]
              end

              after(:all) do
                @carto_layer.tooltip = nil
                @carto_layer.save

                @visualization.reload
                @layer_options_hash = nil
              end

              it 'interactivity contain fields but not cartodb_id' do
                @layer_options_hash[:interactivity].should eq 'hover_status'
              end

              it 'should not contain attributes' do
                @layer_options_hash[:attributes].should be_nil
              end
            end

            describe 'triggered onclick only' do
              before(:all) do
                @carto_layer.infowindow = dummy_infowindow
                @carto_layer.save

                @visualization.reload

                template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
                @layer_options_hash = template_hash[:layergroup][:layers].second[:options]
              end

              after(:all) do
                @carto_layer.infowindow = nil
                @carto_layer.save

                @visualization.reload
                @layer_options_hash = nil
              end

              it 'interactivity should only contain cartodb_id' do
                @layer_options_hash[:interactivity].should eq 'cartodb_id'
              end

              it 'should have attributes' do
                @layer_options_hash[:attributes].should_not be_nil
                @layer_options_hash[:attributes].should_not be_empty
              end

              it 'attributes should have id: cartodb_id' do
                @layer_options_hash[:attributes][:id].should eq 'cartodb_id'
              end

              it 'attributes should contain correct columns' do
                @layer_options_hash[:attributes][:columns].should eq ['click_status']
              end
            end

            describe 'triggered onclick and onhover' do
              before(:all) do
                @carto_layer.infowindow = dummy_infowindow
                @carto_layer.tooltip = dummy_tooltip
                @carto_layer.save

                @visualization.reload

                template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
                @layer_options_hash = template_hash[:layergroup][:layers].second[:options]
              end

              after(:all) do
                @carto_layer.infowindow = nil
                @carto_layer.save

                @visualization.reload
                @layer_options_hash = nil
              end

              it 'interactivity should contain cartodb_id and selected columns' do
                @layer_options_hash[:interactivity].should include 'cartodb_id'
                @layer_options_hash[:interactivity].should_not include 'click_status'
                @layer_options_hash[:interactivity].should include 'hover_status'
              end

              it 'should have attributes' do
                @layer_options_hash[:attributes].should_not be_nil
                @layer_options_hash[:attributes].should_not be_empty
              end

              it 'attributes should have id: cartodb_id' do
                @layer_options_hash[:attributes][:id].should eq 'cartodb_id'
              end

              it 'attributes should contain correct columns but not cartodb_id' do
                @layer_options_hash[:attributes][:columns].should include 'click_status'
                @layer_options_hash[:attributes][:columns].should_not include 'hover_status'
                @layer_options_hash[:attributes][:columns].should_not include 'cartodb_id'
              end
            end
          end

          describe 'with aggregations' do
            before(:all) do
              @carto_layer.options[:query_wrapper] = 'SELECT manolo FROM (<%= sql %>)'
              @carto_layer.save
              @visualization.reload

              @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            end

            after(:all) do
              @carto_layer.options[:query_wrapper] = nil
              @carto_layer.save
              @visualization.reload
              @template_hash = nil
            end

            it 'should contain sql wrap' do
              @template_hash[:layergroup][:layers].second[:options][:sql_wrap].should_not be_nil
            end
          end

          describe 'with analyses' do
            before(:all) do
              @analysis = create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
              @visualization.reload

              @carto_layer.options[:source] = @analysis.natural_id
              @carto_layer.save
            end

            after(:all) do
              @analysis.destroy
              @carto_layer.options.delete(:source)
              @carto_layer.save
              @visualization.reload
              @template_hash = nil
            end

            describe 'and builder' do
              before(:all) do
                @visualization.stubs(:version).returns(3)
                @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
              end

              it 'should not contain sql' do
                @template_hash[:layergroup][:layers].second[:options][:sql].should be_nil
              end

              it 'should contain source' do
                @template_hash[:layergroup][:layers].second[:options][:source][:id].should eq @analysis.natural_id
              end
            end

            describe 'and editor' do
              before(:all) do
                @visualization.stubs(:version).returns(2)
                @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
              end

              it 'should contain sql' do
                @template_hash[:layergroup][:layers].second[:options].should_not be_nil
              end

              it 'should not contain source' do
                @template_hash[:layergroup][:layers].second[:options][:source].should be_nil
              end
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
            @torque_layer = create(:carto_layer, kind: 'torque', maps: [@map])
            @visualization.reload

            @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
          end

          after(:all) do
            @torque_layer.destroy
            @visualization.reload

            @template_hash = nil
          end

          it 'should generate placeholders' do
            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash

            template_hash[:placeholders].length.should be @map.layers.reject(&:basemap?).count
          end

          it 'should have options' do
            @template_hash[:layergroup][:layers].second[:options].should_not be_nil
          end

          it 'should be torque type' do
            @template_hash[:layergroup][:layers].second[:type].should eq 'torque'
          end

          it 'should contain layer id' do
            @template_hash[:layergroup][:layers].second[:id].should_not be_nil
            @template_hash[:layergroup][:layers].second[:id].should eq @torque_layer.id
          end

          describe 'with aggregations' do
            before(:all) do
              @torque_layer.options[:query_wrapper] = 'SELECT manolo FROM (<%= sql %>)'
              @torque_layer.save
              @visualization.reload

              @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            end

            after(:all) do
              @torque_layer.options[:query_wrapper] = nil
              @torque_layer.save
              @visualization.reload
              @template_hash = nil
            end

            it 'should contain sql wrap' do
              @template_hash[:layergroup][:layers].second[:options][:sql_wrap].should eq 'SELECT manolo FROM (<%= sql %>)'
            end

            it 'should not wrap sql' do
              @template_hash[:layergroup][:layers].second[:options][:sql].should_not =~ /SELECT manolo FROM/
            end
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

          it 'should have options' do
            @template_hash[:layergroup][:layers].first[:options].should_not be_nil
          end

          it 'should be http type' do
            @template_hash[:layergroup][:layers].first[:type].should eq 'http'
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

          describe 'when basemap options' do
            before(:all) do
              @tms_layer = @visualization.layers.first
              @tms_layer.options[:tms] = true
              @tms_layer.options[:urlTemplate] = 'http://url_template_example'
              @tms_layer.options[:subdomains] = 'subdomains_example'

              @tms_layer.save
              @visualization.reload

              @tms_layer_hash = Carto::NamedMaps::Template.new(@visualization).to_hash[:layergroup][:layers][0]
            end

            after(:all) do
              @tms_layer = @visualization.layers.first
              @tms_layer.options[:tms] = nil
              @tms_layer.options[:urlTemplate] = nil
              @tms_layer.options[:subdomains] = nil

              @tms_layer.save
              @visualization.reload

              @tms_layer_hash = nil
            end

            it 'should have tms options' do
              @tms_layer_hash[:options][:tms].should be_true
            end

            it 'should have urlTemplate options' do
              @tms_layer_hash[:options][:urlTemplate].should eq 'http://url_template_example'
            end

            it 'should have subdomains options' do
              @tms_layer_hash[:options][:subdomains].should eq 'subdomains_example'
            end
          end

          describe 'when background' do
            before(:all) do
              @background_layer = @visualization.layers.first

              @background_layer.options[:type] = 'plain'

              @background_layer.save
              @visualization.reload

              @background_layer_hash = Carto::NamedMaps::Template.new(@visualization).to_hash[:layergroup][:layers][0]
            end

            after(:all) do
              @background_layer = @visualization.layers.first

              @background_layer.options[:type] = 'plain'

              @background_layer.save
              @visualization.reload

              @background_layer_hash = nil
            end

            it 'should have options' do
              @background_layer_hash[:options].should_not be_nil
            end

            it 'should be http type' do
              @background_layer_hash[:type].should eq 'http'
            end
          end

          describe 'when google maps' do
            before(:all) do
              @gmaps_layer = @visualization.layers.first

              @gmaps_layer.options[:type] = 'gmapsbase'

              @gmaps_layer.save
              @visualization.reload

              @named_map_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            end

            it 'should not be included' do
              @named_map_hash[:layergroup][:layers].none? { |l| l[:type] == 'gmapsbase' }.should be_true
            end
          end
        end
      end

      describe '#auth' do
        describe 'when mapcaps exist' do
          before(:all) do
            @mapcap = Carto::Mapcap.create(visualization_id: @visualization.id)
            @regenerated_visualization = @visualization.latest_mapcap.regenerate_visualization
          end

          after(:all) do
            @mapcap.destroy
            @regenerated_visualization = nil
          end

          it 'should use non-mapcapped visualization for auth' do
            @visualization.stubs(:password_protected?).returns(true)
            @visualization.stubs(:has_password?).returns(true)
            @visualization.stubs(:non_mapcapped).returns(@visualization) # return stubbed object

            @regenerated_visualization.password_protected?.should be_false

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            template_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_SIGNED
          end
        end

        describe 'should be open' do
          after(:each) do
            @visualization.save

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            template_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_OPEN
          end

          it 'for public visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC
          end

          it 'for link visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_LINK
          end
        end

        describe 'should be signed' do
          after(:each) do
            @visualization.save!

            template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
            template_hash[:auth][:valid_tokens].should_not be_empty
            template_hash[:auth][:method].should eq Carto::NamedMaps::Template::AUTH_TYPE_SIGNED
          end

          it 'for password protected visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
            @visualization.password_salt = 'xxx'
            @visualization.encrypted_password = 'yyy'
          end

          it 'for organization private visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
            @visualization.stubs(:organization?).returns(true)
          end

          it 'for private visualizations' do
            @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
          end

          describe 'and include tokens' do
            before(:all) do
              @org = mock
              @org.stubs(:get_auth_token).returns(SecureRandom.urlsafe_base64(nil, false))
              @group = mock
              @group.stubs(:get_auth_token).returns(SecureRandom.urlsafe_base64(nil, false))
              @other_user = mock
              @other_user.stubs(:get_auth_token).returns(SecureRandom.urlsafe_base64(nil, false))
            end

            before(:each) do
              @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
              @visualization.stubs(:organization?).returns(true)
            end

            it 'for owner user always' do
              template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
              template_hash[:auth][:valid_tokens].should eq [@visualization.user.get_auth_token]
            end

            it 'for organization' do
              @visualization.permission.stubs(:entities_with_read_permission).returns([@org])
              template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
              auth_tokens = template_hash[:auth][:valid_tokens]
              auth_tokens.count.should eq 2
              auth_tokens.should include @user.get_auth_token
              auth_tokens.should include @org.get_auth_token
            end

            it 'for group' do
              @visualization.permission.stubs(:entities_with_read_permission).returns([@group])
              template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
              auth_tokens = template_hash[:auth][:valid_tokens]
              auth_tokens.count.should eq 2
              auth_tokens.should include @user.get_auth_token
              auth_tokens.should include @group.get_auth_token
            end

            it 'for other user' do
              @visualization.permission.stubs(:entities_with_read_permission).returns([@other_user])
              template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
              auth_tokens = template_hash[:auth][:valid_tokens]
              auth_tokens.count.should eq 2
              auth_tokens.should include @user.get_auth_token
              auth_tokens.should include @other_user.get_auth_token
            end

            it 'for multiple entities' do
              @visualization.permission.stubs(:entities_with_read_permission).returns([@other_user, @group, @org])
              template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
              auth_tokens = template_hash[:auth][:valid_tokens]
              auth_tokens.count.should eq 4
              auth_tokens.should include @user.get_auth_token
              auth_tokens.should include @other_user.get_auth_token
              auth_tokens.should include @group.get_auth_token
              auth_tokens.should include @org.get_auth_token
            end
          end
        end
      end

      describe '#layergroup' do
        before (:all) { @layergroup_hash = Carto::NamedMaps::Template.new(@visualization).to_hash[:layergroup] }
        after  (:all) { @layergroup_hash = nil }

        it 'should have version according to Map Config' do
          @layergroup_hash[:version].should eq Carto::NamedMaps::Template::MAP_CONFIG_VERSION
        end

        it 'should not have any dataview if no widgets are present' do
          @layergroup_hash[:dataviews].should be_empty
        end

        it 'should not have any analysis if no analyses are present' do
          @layergroup_hash[:analyses].should be_empty
        end

        describe 'dataviews' do
          before(:all) do
            @carto_layer = create(:carto_layer, kind: 'carto', maps: [@map])
            @widget = create(:widget, layer: @carto_layer)
            @visualization.reload

            @dataview_hash = Carto::NamedMaps::Template.new(@visualization).to_hash[:layergroup][:dataviews]
            @template_widget = @dataview_hash[@widget.id]
          end

          after(:all) do
            @carto_layer.destroy
            @widget.destroy
            @visualization.reload

            @dataview_hash = nil
            @template_widget = nil
          end

          it 'should add dataviews if widgets are present' do
            @dataview_hash.should_not be_empty
            @template_widget.should_not be_nil
          end

          it 'should add type correctly' do
            @template_widget[:type].should eq Carto::NamedMaps::Template::TILER_WIDGET_TYPES[@widget.type.to_sym]
          end

          it 'should have only required options' do
            expected_options = @widget.options.merge(aggregationColumn: nil).select do |k, _v|
              Carto::NamedMaps::Template::DATAVIEW_TEMPLATE_OPTIONS.include?(k)
            end

            @template_widget[:options].should eq expected_options
          end
        end

        describe '#analyses' do
          before(:all) do
            @analysis = create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
            @visualization.reload

            @analysis_hash = Carto::NamedMaps::Template.new(@visualization).to_hash[:layergroup][:analyses].first
          end

          after(:all) do
            @analysis.destroy
            @visualization.reload

            @analysis_hash = nil
          end

          it 'should add analyses if analyses are present' do
            @analysis_hash.should_not be_nil
          end

          it 'should have the right definition' do
            @analysis_hash.should eq @analysis.analysis_definition_for_api
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

        describe 'it should use the state when it is present' do
          before do
            @visualization.state.json = {
              map: { ne: [-58.9, -143.9], sw: [37.4, 41.6], center: [-16.2, -51.1], zoom: 4 }
            }
            @template_hash = Carto::NamedMaps::Template.new(@visualization).to_hash
          end

          after do
            @visualization.state.json = {}
          end

          it 'should use the state info for the view when instantiating a named map' do
            @template_hash[:view][:zoom].should eq 4
            template_center = @template_hash[:view][:center]
            template_center[:lat].should eq -16.2
            template_center[:lng].should eq -51.1
            expected_bounds = { west: 37.4, south: 41.6, east: -58.9, north: -143.9 }
            @template_hash[:view][:bounds].should eq expected_bounds
          end

          it 'should not fail when invalid state' do
            @visualization.state.json[:map][:ne] = nil
            result = Carto::NamedMaps::Template.new(@visualization).to_hash
            result[:view][:zoom].should eq 3
            expected_center = { lng: 0.0, lat: 30.0 }
            result[:view][:center].should eq expected_center
          end
        end

        describe '#preview_layers' do
          before(:all) do
            @carto_layer = create(:carto_layer, kind: 'carto', maps: [@map])
            @visualization.reload

            template = Carto::NamedMaps::Template.new(@visualization)
            @preview_layers = template.to_hash[:view][:preview_layers]
          end

          after(:all) do
            @carto_layer.destroy
            @visualization.reload

            @preview_layers = nil
          end

          it 'should contain preview_layers' do
            @preview_layers.should_not be_nil
          end

          it 'should not generate preview_layers for basemaps' do
            preview_layers_ids = @preview_layers.keys.flatten

            @visualization.base_layers.map(&:id).each do |id|
              preview_layers_ids.should_not include(id)
            end
          end

          it 'should generate preview_layers correctly' do
            @visualization.data_layers.should_not be_empty
            @visualization.data_layers.each do |layer|
              expected_visibility = layer.options['visible'] || false
              @preview_layers[layer.id.to_sym].should eq expected_visibility
            end
          end
        end
      end
    end
  end
end
