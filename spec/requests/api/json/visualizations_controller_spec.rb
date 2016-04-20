# encoding: utf-8

require_relative '../../../spec_helper'
require_relative 'visualizations_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/visualizations_controller'

describe Api::Json::VisualizationsController do
  it_behaves_like 'visualization controllers' do
  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper

  before(:all) do
    @user = create_user(username: 'test')
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
  end

  # let(:params) { { api_key: @user.api_key } }

  before(:each) do
    stub_named_maps_calls
    host! "#{@user.username}.localhost.lan"
  end

  after(:each) do
    stub_named_maps_calls
    delete_user_data @user
  end

  describe "#update" do
    before(:each) do
      login(@user)
    end

    it "Reverts privacy changes if named maps communitacion fails" do

      @user.private_tables_enabled = true
      @user.save

      table = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance
                                          .stubs(:create)
                                          .raises(CartoDB::NamedMapsWrapper::HTTPResponseError)

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

  describe '#duplicate map' do
    before(:all) do
      bypass_named_maps

      @map = Map.create(user_id: @user.id, table_id: create_table(user_id: @user.id).id)
      @visualization = Carto::Visualization.where(map_id: @map.id).first

      @other_user = create_user(username: 'other-user')
    end

    after(:all) do
      @map.destroy
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

      CartoDB::Visualization::Member.any_instance
                                    .stubs(:has_permission?)
                                    .with(@other_user, Visualization::Member::PERMISSION_READONLY)
                                    .returns(true)

      post_json api_v1_visualizations_create_url(user_domain: @other_user.username, api_key: @other_user.api_key),
                source_visualization_id: @visualization.id,
                name: new_name

      last_response.status.should be_success

      Carto::Visualization.exists?(user_id: @other_user.id, type: 'derived', name: new_name).should be_true
    end

    it "doesn't duplicate someone else's map without permission" do
      new_name = @visualization.name + ' patatas'

      post_json api_v1_visualizations_create_url(user_domain: @other_user.username, api_key: @other_user.api_key),
                source_visualization_id: @visualization.id,
                name: new_name

      last_response.status.should == 403

      Carto::Visualization.exists?(user_id: @other_user.id, type: 'derived', name: new_name).should be_false
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
