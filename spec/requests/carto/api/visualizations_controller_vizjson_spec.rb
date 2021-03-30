require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

# TODO: Remove once Carto::Visualization is complete enough
require_relative '../../../../app/models/visualization/member'
require_relative './vizjson_shared_examples'
require_relative './helpers/visualization_controller_helper'
require 'helpers/unique_names_helper'
require_dependency 'carto/uuidhelper'
require 'factories/carto_visualizations'
require 'helpers/visualization_destruction_helper'
require 'helpers/feature_flag_helper'

include Carto::UUIDHelper

describe Carto::Api::VisualizationsController do
  include UniqueNamesHelper
  include Carto::Factories::Visualizations
  include VisualizationDestructionHelper
  include FeatureFlagHelper
  include VisualizationControllerHelper

  before(:all) do
    create_account_type_fg('ORGANIZATION USER')
  end

  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)

    Carto::NamedMaps::Api.any_instance.stubs(get: nil, create: true, update: true)

    @user_1 = create(:valid_user)
    @carto_user1 = Carto::User.find(@user_1.id)
    @user_2 = create(:valid_user, private_maps_enabled: true)
    @carto_user2 = Carto::User.find(@user_2.id)
    @api_key = @user_1.api_key
  end

  before(:each) do
    begin
      delete_user_data @user_1
    rescue StandardError => exception
      # Silence named maps problems only here upon data cleaning, not in specs
      raise unless exception.class.to_s == 'CartoDB::NamedMapsWrapper::HTTPResponseError'
    end

    @headers = {
      'CONTENT_TYPE' => 'application/json'
    }
    host! "#{@user_1.username}.localhost.lan"
  end

  after(:all) do
    @user_1.destroy
    @user_2.destroy
  end

  describe 'legacy controller migration' do
    before(:all) do
      @user = create_user
    end

    after(:all) do
      bypass_named_maps
      @user.destroy
    end

    before(:each) do
      bypass_named_maps
      # bypass_metrics

      host! "#{@user.username}.localhost.lan"
    end

    after(:each) do
      bypass_named_maps
      delete_user_data @user
    end

    describe '#create' do
      describe '#duplicate map' do
        before(:all) do
          @other_user = create_user
        end

        before(:each) do
          bypass_named_maps

          @map = Map.create(user_id: @user.id)
          @visualization = create(:derived_visualization,
                                              map_id: @map.id,
                                              user_id: @user.id,
                                              privacy: Visualization::Member::PRIVACY_PRIVATE)
        end

        after(:each) do
          @map.destroy
        end

        after(:all) do
          @other_user.destroy
        end

        it 'duplicates a map' do
          new_name = @visualization.name + ' patatas'

          post_json api_v1_visualizations_create_url(api_key: @user.api_key),
                    source_visualization_id: @visualization.id,
                    name: new_name

          last_response.status.should be_success

          Carto::Visualization.exists?(user_id: @user.id, type: 'derived', name: new_name).should be_true
        end

        it 'registers table dependencies for duplicated maps' do
          map, table, table_visualization, visualization = create_full_visualization(Carto::User.find(@user.id))
          new_name = visualization.name + ' registered'

          post_json api_v1_visualizations_create_url(api_key: @user.api_key),
                    source_visualization_id: visualization.id,
                    name: new_name

          last_response.status.should be_success

          visualization = Carto::Visualization.where(user_id: @user.id, type: 'derived', name: new_name).first
          visualization.should be
          visualization.data_layers.first.user_tables.count.should eq 1

          destroy_full_visualization(map, table, table_visualization, visualization)
        end

        it "duplicates someone else's map if has at least read permission to it" do
          new_name = @visualization.name + ' patatas'

          Carto::Visualization.any_instance.stubs(:is_viewable_by_user?).returns(true)

          post_json api_v1_visualizations_create_url(user_domain: @other_user.username, api_key: @other_user.api_key),
                    source_visualization_id: @visualization.id,
                    name: new_name

          last_response.status.should be_success

          Carto::Visualization.exists?(user_id: @other_user.id, type: 'derived', name: new_name).should be_true
        end

        it "doesn't duplicate someone else's map without permission" do
          new_name = @visualization.name + ' patatatosky'

          post_json api_v1_visualizations_create_url(user_domain: @other_user.username, api_key: @other_user.api_key),
                    source_visualization_id: @visualization.id,
                    name: new_name

          last_response.status.should == 403

          Carto::Visualization.exists?(user_id: @other_user.id, type: 'derived', name: new_name).should be_false
        end
      end

      describe 'map creation from datasets' do
        include_context 'organization with users helper'

        it 'creates a visualization from a dataset given the viz id' do
          table1 = create_table(user_id: @org_user_1.id)
          payload = {
            source_visualization_id: table1.table_visualization.id,
            visChanges: 0,
            name: "untitled_table_XXX_map"
          }
          post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                    payload) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = CartoDB::Visualization::Member.new(id: vid).fetch

            v.user_id.should eq @org_user_1.id
            v.map.user_id.should eq @org_user_1.id
          end
        end

        it 'does not create visualizations if user is viewer' do
          table1 = create_table(user_id: @org_user_1.id)
          payload = {
            source_visualization_id: table1.table_visualization.id,
            visChanges: 0,
            name: "untitled_table_XXX_map"
          }

          @org_user_1.viewer = true
          @org_user_1.save

          post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                    payload) do |response|
            response.status.should eq 403
          end

          @org_user_1.viewer = false
          @org_user_1.save
        end

        it 'creates a visualization from a dataset given the table id' do
          table1 = create_table(user_id: @org_user_1.id)
          payload = {
            tables: [table1.name]
          }
          post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                    payload) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = CartoDB::Visualization::Member.new(id: vid).fetch

            v.user_id.should eq @org_user_1.id
            v.map.user_id.should eq @org_user_1.id
          end
        end

        it 'correctly creates a visualization from two dataset of different users' do
          table1 = create_table(user_id: @org_user_1.id)
          table2 = create_table(user_id: @org_user_2.id)
          share_table_with_user(table1, @org_user_2)
          payload = {
            type: 'derived',
            tables: ["#{@org_user_1.username}.#{table1.name}", table2.name]
          }
          post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                    payload) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = CartoDB::Visualization::Member.new(id: vid).fetch

            v.user_id.should eq @org_user_2.id
            v.map.user_id.should eq @org_user_2.id
          end
        end

        describe 'builder and editor behaviour' do
          before(:all) do
            @old_builder_enabled = @org_user_1.builder_enabled
          end

          after(:all) do
            @org_user_1.builder_enabled = @old_builder_enabled
            @org_user_1.save
          end

          describe 'for editor users' do
            before(:all) do
              @org_user_1.builder_enabled = false
              @org_user_1.save
            end

            it 'copies the styles' do
              table1 = create_table(user_id: @org_user_1.id)
              payload = {
                tables: [table1.name]
              }
              post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                        payload) do |response|
                response.status.should eq 200
                vid = response.body[:id]
                v = CartoDB::Visualization::Member.new(id: vid).fetch
                original_layer = table1.map.data_layers.first
                layer = v.map.data_layers.first
                layer.options['tile_style'].should eq original_layer.options['tile_style']
              end
            end

            it 'doesn\'t add style properties' do
              table1 = create_table(user_id: @org_user_1.id)
              payload = {
                tables: [table1.name]
              }
              post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                        payload) do |response|
                response.status.should eq 200
                vid = response.body[:id]
                v = CartoDB::Visualization::Member.new(id: vid).fetch

                layer = v.map.data_layers.first
                layer.options['style_properties'].should be_nil
              end
            end
          end

          describe 'for builder users' do
            before(:all) do
              @org_user_1.builder_enabled = true
              @org_user_1.save
            end

            it 'resets the styles' do
              table1 = create_table(user_id: @org_user_1.id)
              Table.any_instance.stubs(:geometry_types).returns(['ST_Point'])
              payload = {
                tables: [table1.name]
              }
              post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                        payload) do |response|
                response.status.should eq 200
                vid = response.body[:id]
                v = CartoDB::Visualization::Member.new(id: vid).fetch

                original_layer = table1.map.data_layers.first
                layer = v.map.data_layers.first
                layer.options['tile_style'].should_not eq original_layer.options['tile_style']
              end
            end

            it 'adds style properties' do
              table1 = create_table(user_id: @org_user_1.id)
              Table.any_instance.stubs(:geometry_types).returns(['ST_Point'])
              payload = {
                tables: [table1.name]
              }
              post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                        payload) do |response|
                response.status.should eq 200
                vid = response.body[:id]
                v = CartoDB::Visualization::Member.new(id: vid).fetch

                layer = v.map.data_layers.first
                layer.options['style_properties'].should_not be_nil
              end
            end
          end
        end

        it 'rewrites queries for other user datasets' do
          table1 = create_table(user_id: @org_user_1.id)
          layer = table1.map.data_layers.first
          layer.options['query'] = "SELECT * FROM #{table1.name} LIMIT 1"
          layer.save
          share_table_with_user(table1, @org_user_2)
          payload = {
            type: 'derived',
            tables: ["#{@org_user_1.username}.#{table1.name}"]
          }
          post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                    payload) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = CartoDB::Visualization::Member.new(id: vid).fetch
            layer = v.map.data_layers.first
            layer.options['query'].should eq "SELECT * FROM #{@org_user_1.username}.#{table1.name} LIMIT 1"
          end
        end

        it 'does not rewrite queries for same user datasets' do
          table1 = create_table(user_id: @org_user_1.id)
          layer = table1.map.data_layers.first
          layer.options['query'] = "SELECT * FROM #{table1.name} LIMIT 1"
          layer.save
          share_table_with_user(table1, @org_user_1)
          payload = {
            type: 'derived',
            tables: ["#{@org_user_1.username}.#{table1.name}"]
          }
          post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                    payload) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = CartoDB::Visualization::Member.new(id: vid).fetch
            new_layer = v.map.data_layers.first
            new_layer.options['query'].should eq layer.options['query']
          end
        end

        it 'sets table privacy if the user has private_maps' do
          table1 = create_table(user_id: @org_user_1.id)
          payload = {
            tables: [table1.name]
          }
          post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                    payload) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = CartoDB::Visualization::Member.new(id: vid).fetch
            v.privacy.should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE
          end
        end

        it 'sets PUBLIC privacy if the user doesn\'t have private_maps' do
          @carto_org_user_2.update_column(:private_maps_enabled, false) # Direct to DB to skip validations
          table1 = create_table(user_id: @org_user_2.id)
          payload = {
            tables: [table1.name]
          }
          post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                    payload) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = CartoDB::Visualization::Member.new(id: vid).fetch
            v.privacy.should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC
          end
        end

        it 'enables scrollwheel zoom by default' do
          table1 = create_table(user_id: @org_user_2.id)
          table1.map.scrollwheel = false
          table1.map.options[:scrollwheel] = false
          table1.map.save

          post_json(api_v1_visualizations_create_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key),
                    tables: [table1.name]) do |response|
            response.status.should eq 200
            vid = response.body[:id]
            v = Carto::Visualization.find(vid)
            v.map.scrollwheel.should eq true
            v.map.options[:scrollwheel].should eq true
          end
        end
      end
    end

    describe "#update" do
      before(:each) do
        login(@user)
      end

      it "Does not update visualizations if user is viewer" do
        table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

        @user.viewer = true
        @user.save

        payload = { id: table.table_visualization.id, privacy: Carto::Visualization::PRIVACY_PRIVATE }
        put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
          response.status.should eq 403
        end

        @user.viewer = false
        @user.save

        table.destroy
      end

      it "Updates changes even if named maps communication fails" do
        @user.private_tables_enabled = true
        @user.save

        table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

        Carto::NamedMaps::Api.any_instance.stubs(:create).raises('fake named maps failure')

        payload = { id: table.table_visualization.id, privacy: Carto::Visualization::PRIVACY_PRIVATE }
        put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
          response.status.should be_success
        end

        table.reload
        table.privacy.should eq ::UserTable::PRIVACY_PRIVATE

        table.destroy

        @user.private_tables_enabled = false
        @user.save
      end

      it 'filters attributes' do
        table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

        table.table_visualization.description.should_not eq "something"

        payload = { id: table.table_visualization.id, description: "something", fake: "NO!" }
        put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
          response.status.should be_success
        end

        table.reload
        table.table_visualization.description.should eq "something"

        table.destroy
      end

      it "renames datasets" do
        table = new_table(user_id: @user.id).save.reload

        payload = { id: table.table_visualization.id, name: 'vis_rename_test1' }
        put_json api_v1_visualizations_update_url(id: table.table_visualization.id), payload do |response|
          response.status.should be_success
        end

        table.reload
        table.name.should eq 'vis_rename_test1'

        table.destroy
      end

      it 'sets password protection' do
        visualization = create(:carto_visualization, user_id: @user.id)
        visualization.password_protected?.should be_false

        payload = {
          id: visualization.id,
          password: 'the_pass',
          privacy: Carto::Visualization::PRIVACY_PROTECTED
        }
        put_json api_v1_visualizations_update_url(id: visualization.id), payload do |response|
          response.status.should be_success
        end

        visualization.reload
        visualization.password_protected?.should be_true
        visualization.password_valid?('the_pass').should be_true

        visualization.destroy
      end

      it 'migrates visualizations to v3' do
        _, _, _, visualization = create_full_visualization(@user)
        visualization.update_attributes!(version: 2)
        visualization.analyses.each(&:destroy)

        payload = {
          id: visualization.id,
          version: 3
        }
        put_json api_v1_visualizations_update_url(id: visualization.id), payload do |response|
          response.status.should be_success
          expect(response.body[:version]).to eq 3
        end

        visualization.reload
        expect(visualization.analyses.any?).to be_true

        visualization.destroy
      end
    end
  end

  # Specific tests for vizjson 3. Common are at `vizjson_shared_examples`
  describe '#vizjson3' do
    include Fixtures::Layers::Infowindows
    include Fixtures::Layers::Tooltips
    include Carto::Factories::Visualizations

    include_context 'visualization creation helpers'

    def get_vizjson3_url(user, visualization)
      args = { user_domain: user.username, id: visualization.id, api_key: user.api_key }
      api_v3_visualizations_vizjson_url(args)
    end

    def first_layer_definition_from_response(response)
      index = response.body[:layers].index { |l| l[:options] && l[:options][:layer_definition] }
      response.body[:layers][index][:options][:layer_definition]
    end

    def first_layer_named_map_from_response(response)
      index = response.body[:layers].index { |l| l[:options] && l[:options][:named_map] }
      response.body[:layers][index][:options][:named_map]
    end

    def first_data_layer_from_response(response)
      index = response.body[:layers].index { |l| l[:type] == 'CartoDB' }
      response.body[:layers][index]
    end

    let(:infowindow) do
      build_stubbed(:carto_layer_with_infowindow).infowindow
    end

    let(:tooltip) do
      build_stubbed(:carto_layer_with_tooltip).tooltip
    end

    before(:each) do
      @map, @table, @table_visualization, @visualization = create_full_visualization(Carto::User.find(@user_1.id))

      @table.privacy = UserTable::PRIVACY_PUBLIC
      @table.save
      layer = @visualization.data_layers.first
      layer.infowindow = infowindow
      layer.tooltip = tooltip
      layer.options[:table_name] = @table.name
      layer.options[:query] = "select * from #{@table.name}"
      layer.save
    end

    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    describe 'layer templates' do
      describe 'anonymous maps' do
        before(:each) do
          @table.privacy = UserTable::PRIVACY_PUBLIC
          @table.save
        end

        it 'uses v3 infowindows and tooltips templates removing "table/views/" from template_name' do
          # vizjson v2 doesn't change
          get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                     id: @visualization.id,
                                                     api_key: @user_1.api_key), @headers do |response|
            response.status.should eq 200

            layer_definition = first_layer_definition_from_response(response)
            response_infowindow = layer_definition[:layers][0][:infowindow]
            response_infowindow[:template_name].should eq infowindow[:template_name]
            response_infowindow[:template].should include(v2_infowindow_light_template_fragment)
            response_infowindow[:template].should_not include(v3_infowindow_light_template_fragment)

            response_tooltip = layer_definition[:layers][0][:tooltip]
            response_tooltip[:template_name].should eq tooltip[:template_name]
            response_tooltip[:template].should include(v2_tooltip_light_template_fragment)
            response_tooltip[:template].should_not include(v3_tooltip_light_template_fragment)

          end

          get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
            response.status.should eq 200

            layer = first_data_layer_from_response(response)
            response_infowindow = layer[:infowindow]
            infowindow[:template_name].should eq "table/views/infowindow_light"
            response_infowindow[:template_name].should eq "infowindow_light"
            response_infowindow[:template].should include(v3_infowindow_light_template_fragment)
            response_infowindow[:template].should_not include(v2_infowindow_light_template_fragment)

            response_tooltip = layer[:tooltip]
            response_tooltip[:template_name].should eq tooltip[:template_name]
            response_tooltip[:template].should include(v3_tooltip_light_template_fragment)
            response_tooltip[:template].should_not include(v2_tooltip_light_template_fragment)
          end
        end
      end

      describe 'named maps' do
        before(:each) do
          Carto::User.any_instance.stubs(:private_tables_enabled?).returns(true)
          Carto::User.any_instance.stubs(:private_tables_enabled).returns(true)
          @table.user.reload
          @table.privacy = UserTable::PRIVACY_PRIVATE
          @table.save!
        end

        it 'uses v3 infowindows templates at named maps removing "table/views/" from template_name' do
          # vizjson v2 doesn't change
          get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                     id: @visualization.id,
                                                     api_key: @user_1.api_key), @headers do |response|
            response.status.should eq 200

            layer_named_map = first_layer_named_map_from_response(response)
            response_infowindow = layer_named_map[:layers][0][:infowindow]
            response_infowindow[:template_name].should eq infowindow[:template_name]
            response_infowindow[:template].should include(v2_infowindow_light_template_fragment)
            response_infowindow[:template].should_not include(v3_infowindow_light_template_fragment)

            response_tooltip = layer_named_map[:layers][0][:tooltip]
            response_tooltip[:template_name].should eq tooltip[:template_name]
            response_tooltip[:template].should include(v2_tooltip_light_template_fragment)
            response_tooltip[:template].should_not include(v3_tooltip_light_template_fragment)
          end

          get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
            response.status.should eq 200

            layer = first_data_layer_from_response(response)
            response_infowindow = layer[:infowindow]
            infowindow[:template_name].should eq "table/views/infowindow_light"
            response_infowindow[:template_name].should eq 'infowindow_light'
            response_infowindow[:template].should include(v3_infowindow_light_template_fragment)
            response_infowindow[:template].should_not include(v2_infowindow_light_template_fragment)

            response_tooltip = layer[:tooltip]
            response_tooltip[:template_name].should eq tooltip[:template_name]
            response_tooltip[:template].should include(v3_tooltip_light_template_fragment)
            response_tooltip[:template].should_not include(v2_tooltip_light_template_fragment)
          end
        end
      end
    end

    describe 'layer custom infowindows and tooltips' do
      before(:each) do
        layer = @visualization.data_layers.first
        layer.infowindow = custom_infowindow
        layer.tooltip = custom_tooltip
        layer.save
      end

      describe 'anonymous maps' do
        before(:each) do
          @table.privacy = UserTable::PRIVACY_PUBLIC
          @table.save
        end

        it 'uses v3 infowindows and tooltips templates' do
          # vizjson v2 doesn't change
          get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                     id: @visualization.id,
                                                     api_key: @user_1.api_key), @headers do |response|
            response.status.should eq 200

            layer_definition = first_layer_definition_from_response(response)
            response_infowindow = layer_definition[:layers][0][:infowindow]
            response_infowindow[:template_name].should eq ''
            response_infowindow[:template].should eq custom_infowindow[:template]

            response_tooltip = layer_definition[:layers][0][:tooltip]
            response_tooltip[:template_name].should eq ''
            response_tooltip[:template].should eq custom_tooltip[:template]
          end

          get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
            response.status.should eq 200

            layer = first_data_layer_from_response(response)
            response_infowindow = layer[:infowindow]
            response_infowindow[:template_name].should eq ''
            response_infowindow[:template].should eq custom_infowindow[:template]

            response_tooltip = layer[:tooltip]
            response_tooltip[:template_name].should eq ''
            response_tooltip[:template].should eq custom_tooltip[:template]
          end
        end
      end

      describe 'named maps' do
        before(:each) do
          Carto::User.any_instance.stubs(:private_tables_enabled?).returns(true)
          Carto::User.any_instance.stubs(:private_tables_enabled).returns(true)
          @table.user.reload
          @table.privacy = UserTable::PRIVACY_PRIVATE
          @table.save
        end

        it 'uses v3 infowindows templates at named maps' do
          # vizjson v2 doesn't change
          get_json api_v2_visualizations_vizjson_url(user_domain: @user_1.username,
                                                     id: @visualization.id,
                                                     api_key: @user_1.api_key), @headers do |response|
            response.status.should eq 200

            layer_named_map = first_layer_named_map_from_response(response)
            response_infowindow = layer_named_map[:layers][0][:infowindow]
            response_infowindow[:template_name].should eq ''
            response_infowindow[:template].should eq custom_infowindow[:template]

            response_tooltip = layer_named_map[:layers][0][:tooltip]
            response_tooltip[:template_name].should eq ''
            response_tooltip[:template].should eq custom_tooltip[:template]
          end

          get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
            response.status.should eq 200

            layer = first_data_layer_from_response(response)
            response_infowindow = layer[:infowindow]
            response_infowindow[:template_name].should eq ''
            response_infowindow[:template].should eq custom_infowindow[:template]

            response_tooltip = layer[:tooltip]
            response_tooltip[:template_name].should eq ''
            response_tooltip[:template].should eq custom_tooltip[:template]
          end
        end
      end
    end

    it 'returns a vizjson with empty widgets array for visualizations without widgets' do
      get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
        response.status.should == 200
        vizjson3 = response.body
        vizjson3.keys.should include(:widgets)
        vizjson3[:widgets].should == []
      end
    end

    it 'returns visualization widgets' do
      layer = @visualization.layers.first
      widget = create(:widget, layer: layer)

      widget2 = create(:widget_with_layer, type: 'fake')

      get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
        response.status.should == 200
        vizjson3 = response.body
        vizjson3[:widgets].length.should == 1

        vizjson3[:widgets].map { |w| w[:type] }.should include(widget.type)
        vizjson3[:widgets].map { |w| w[:layer_id] }.should include(layer.id)

        widget2.destroy
        widget.destroy
      end
    end

    it 'returns datasource' do
      get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
        response.status.should == 200
        vizjson3 = response.body
        vizjson3[:datasource][:user_name].should == @user_1.username
        vizjson3[:datasource][:maps_api_template].should_not be_nil
        vizjson3[:datasource][:stat_tag].should_not be_nil

        vizjson3[:user][:fullname].should == (@user_1.name.nil? ? @user_1.username : @user_1.name)
        vizjson3[:user][:avatar_url].should_not be_nil
      end
    end

    it 'returns datasource.template_name for visualizations with retrieve_named_map? true' do
      Carto::Visualization.any_instance.stubs(:retrieve_named_map?).returns(true)
      get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
        response.status.should == 200
        vizjson3 = response.body
        vizjson3[:datasource][:template_name].should_not be_nil
      end
    end

    it 'returns nil datasource.template_name for visualizations with retrieve_named_map? false' do
      Carto::Visualization.any_instance.stubs(:retrieve_named_map?).returns(false)
      get_json get_vizjson3_url(@user_1, @visualization), @headers do |response|
        response.status.should == 200
        vizjson3 = response.body
        vizjson3[:datasource].key?(:template_name).should be_false
      end
    end
  end
end
