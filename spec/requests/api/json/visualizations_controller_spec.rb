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
    new_table(attrs.merge(user_id: $user_1.id)).save.reload
  end
end
