require 'spec_helper_unit'
require_relative 'synchronizations_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/synchronizations_controller'

describe Api::Json::SynchronizationsController do
  it_behaves_like 'synchronization controllers' do
  end

  before do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    @user1 = create(:valid_user, private_tables_enabled: true, private_maps_enabled: true)
    login(@user1)
    @user1.sync_tables_enabled = true
    @user1.save
  end

  describe '#create' do
    let(:params) do
      {
        url: "fake_url",
        interval: 3600,
        content_guessing: true,
        type_guessing: true,
        create_vis: false
      }
    end

    describe 'for users without sync tables' do
      before(:each) do
        @user1.sync_tables_enabled = false
        @user1.save
      end

      it 'returns 401' do
        post_json api_v1_synchronizations_create_url(params) do |r|
          r.status.should eq 401
        end
      end

      it 'creates a synchronization and enqueues a import job for external sources' do
        Resque::ImporterJobs.expects(:perform).once
        carto_visualization = create(:carto_visualization, user_id: @user1.id)
        external_source = create(:external_source, visualization: carto_visualization)
        remote_id = external_source.visualization_id

        expect {
          post_json api_v1_synchronizations_create_url(params.merge(remote_visualization_id: remote_id)) do |r|
            r.status.should eq 200
            Carto::Synchronization.find(r.body[:id]).state.should eq Carto::Synchronization::STATE_QUEUED
          end
        }.to change { Carto::Synchronization.count }.by 1
      end
    end

    it 'creates a synchronization and enqueues a import job' do
      Resque::ImporterJobs.expects(:perform).once
      expect {
        post_json api_v1_synchronizations_create_url(params) do |r|
          r.status.should eq 200
          Carto::Synchronization.find(r.body[:id]).state.should eq Carto::Synchronization::STATE_QUEUED
        end
      }.to change { Carto::Synchronization.count }.by 1
    end
  end

  describe '#sync_now' do
    it 'syncs... now :D' do
      sync = create(:carto_synchronization, user_id: @user1.id)
      sync.state.should eq Carto::Synchronization::STATE_SUCCESS
      Resque::SynchronizationJobs.expects(:perform).once
      put_json api_v1_synchronizations_sync_now_url(id: sync.id) do |r|
        r.status.should eq 200
        sync.reload
        sync.state.should eq Carto::Synchronization::STATE_QUEUED
      end
    end
  end

  describe '#update' do
    it 'updates the interval' do
      sync = create(:carto_synchronization, user_id: @user1.id)
      new_interval = sync.interval * 2
      put_json api_v1_synchronizations_update_url(id: sync.id), interval: new_interval do |r|
        r.status.should eq 200
        sync.reload
        sync.interval.should eq new_interval
      end
    end
  end

  describe '#destroy' do
    it 'destroys a sync' do
      sync = create(:carto_synchronization, user_id: @user1.id)
      Carto::Synchronization.exists?(sync.id).should be_true
      delete_json api_v1_synchronizations_update_url(id: sync.id) do |r|
        r.status.should eq 204
        Carto::Synchronization.exists?(sync.id).should be_false
      end
    end
  end
end
