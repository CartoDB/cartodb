# encoding: utf-8

require 'helpers/metrics_helper'

require_relative '../../../spec_helper'
require_relative 'visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/visualizations_controller'
require_relative '.././../../factories/organizations_contexts'

describe Api::Json::VisualizationsController do
  it_behaves_like 'visualization controllers' do
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper
  include MetricsHelper

  before(:all) do
    @user = create_user(username: 'test')
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  # let(:params) { { api_key: @user.api_key } }

  before(:each) do
    bypass_named_maps
    bypass_metrics

    host! "#{@user.username}.localhost.lan"
  end

  after(:each) do
    bypass_named_maps
    delete_user_data @user
  end

  describe '#create' do
    describe '#duplicate map' do
      before(:all) do
        @other_user = create_user(username: 'other-user')
      end

      before(:each) do
        bypass_named_maps

        @map = Map.create(user_id: @user.id, table_id: create_table(user_id: @user.id).id)
        @visualization = FactoryGirl.create(:derived_visualization, map_id: @map.id, user_id: @user.id,
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

    describe '#creates map from datasets' do
      include_context 'organization with users helper'
      include TableSharing

      it 'creates a visualization from a dataset given the viz id' do
        table1 = create_table(user_id: @org_user_1.id)
        payload = {
          source_visualization_id: table1.table_visualization.id
        }
        post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                  payload) do |response|
          response.status.should eq 200
          vid = response.body[:id]
          v = CartoDB::Visualization::Member.new(id: vid).fetch

          v.user.should eq @org_user_1
          v.map.user.should eq @org_user_1
        end
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

          v.user.should eq @org_user_1
          v.map.user.should eq @org_user_1
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

          v.user.should eq @org_user_2
          v.map.user.should eq @org_user_2
        end
      end

      it 'copies the styles for editor users' do
        table1 = create_table(user_id: @org_user_1.id)
        payload = {
          tables: [table1.name]
        }
        User.any_instance.stubs(:builder_enabled?).returns(false)
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

      it 'resets the styles for builder users' do
        table1 = create_table(user_id: @org_user_1.id)
        Table.any_instance.stubs(:geometry_types).returns(['ST_Point'])
        payload = {
          tables: [table1.name]
        }
        User.any_instance.stubs(:builder_enabled?).returns(true)
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

      it 'doen\'t add style properites for editor users' do
        table1 = create_table(user_id: @org_user_1.id)
        payload = {
          tables: [table1.name]
        }
        User.any_instance.stubs(:builder_enabled?).returns(false)
        post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                  payload) do |response|
          response.status.should eq 200
          vid = response.body[:id]
          v = CartoDB::Visualization::Member.new(id: vid).fetch

          layer = v.map.data_layers.first
          layer.options['style_properties'].should be_nil
        end
      end

      it 'adds style properites for builder users' do
        table1 = create_table(user_id: @org_user_1.id)
        Table.any_instance.stubs(:geometry_types).returns(['ST_Point'])
        payload = {
          tables: [table1.name]
        }
        User.any_instance.stubs(:builder_enabled?).returns(true)
        post_json(api_v1_visualizations_create_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key),
                  payload) do |response|
          response.status.should eq 200
          vid = response.body[:id]
          v = CartoDB::Visualization::Member.new(id: vid).fetch

          layer = v.map.data_layers.first
          layer.options['style_properties'].should_not be_nil
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
    end
  end

  describe "#update" do
    before(:each) do
      login(@user)
    end

    it "Reverts privacy changes if named maps communitacion fails" do

      @user.private_tables_enabled = true
      @user.save

      table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

      Carto::NamedMaps::Api.any_instance
                           .stubs(:create)
                           .raises('manolos')

      put_json api_v1_visualizations_update_url(id: table.table_visualization.id),
      {
        visualization_id: table.table_visualization.id,
        privacy: Carto::Visualization::PRIVACY_PRIVATE
      }.to_json do |response|
        response.status.should_not be_success
        response.status.should eq 400
      end

      table.reload
      table.privacy.should eq ::UserTable::PRIVACY_PUBLIC

      @user.private_tables_enabled = false
      @user.save
    end

  end

  describe '#likes' do

    before(:each) do
      login(@user)
    end

    it "when a map is liked should send an email to the owner" do
      user_owner = create_user
      table = new_table({user_id: user_owner.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload
      vis, rejected_layers = CartoDB::Visualization::DerivedCreator.new(user_owner, [table]).create
      rejected_layers.empty?.should be true
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::MapLiked, vis.id, @user.id, kind_of(String)).returns(true)
      post_json api_v1_visualizations_add_like_url({
          id: vis.id
        }) do |response|
        response.status.should be_success
      end
    end

    it "when a map is liked by the owner, the email should not be sent" do
      table = new_table({user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload
      vis, rejected_layers = CartoDB::Visualization::DerivedCreator.new(@user, [table]).create
      rejected_layers.empty?.should be true
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::MapLiked, vis.id, @user.id, kind_of(String)).never
      post_json api_v1_visualizations_add_like_url({
          id: vis.id
        }) do |response|
        response.status.should be_success
      end
    end

    it "when a dataset is liked should send an email to the owner" do
      user_owner = create_user
      vis = new_table({user_id: user_owner.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload.table_visualization
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::TableLiked, vis.id, @user.id, kind_of(String)).returns(true)
      post_json api_v1_visualizations_add_like_url({
          id: vis.id
        }) do |response|
        response.status.should be_success
      end
    end

    it "when a dataset is liked by the owner, the email should not be sent" do
      vis = new_table({user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload.table_visualization
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::TableLiked, vis.id, @user.id, kind_of(String)).never
      post_json api_v1_visualizations_add_like_url({
          id: vis.id
        }) do |response|
        response.status.should be_success
      end
    end
  end

  def table_factory(attrs = {})
    new_table(attrs.merge(user_id: @user_1.id)).save.reload
  end
end
