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
    @user.destroy
  end

  # let(:params) { { api_key: @user.api_key } }

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
    host! "#{@user.username}.localhost.lan"
  end

  after(:each) do
    delete_user_data @user
  end

  describe '#likes' do

    before(:each) do
      login(@user)
    end

    it "when a map is liked should send an email to the owner" do
      user_owner = create_user
      vis = new_table({user_id: user_owner.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload.table_visualization
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::MapLiked, vis.id, @user.id, kind_of(String)).returns(true)
      post_json api_v1_visualizations_add_like_url({
          id: vis.id
        }) do |response|
        response.status.should be_success
      end
    end

    it "when a map is liked by the owner, the email should not be sent" do
      vis = new_table({user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload.table_visualization
      Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::MapLiked, vis.id, @user.id, kind_of(String)).never
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
