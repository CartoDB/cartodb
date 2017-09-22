# encoding: utf-8

require_relative '../../../spec_helper'
require_relative 'synchronizations_controller_shared_examples'
require_relative '../../../../app/controllers/api/json/synchronizations_controller'

describe Api::Json::SynchronizationsController do
  include_context 'users helper'

  it_behaves_like 'synchronization controllers' do
  end

  let(:file_url) do
    "https://raw.githubusercontent.com/CartoDB/cartodb/72cd3298130f8f2b46b3b66d2f53431e4396f4ac/spec/support/data/guess_country.csv"
  end

  before(:each) do
    login(@user1)
    @user1.sync_tables_enabled = true
    @user1.save
  end

  describe '#create' do
    let(:params) do
      {
        url: file_url,
        interval: 3600,
        content_guessing: true,
        type_guessing: true,
        create_vis: false
      }
    end

    it 'returns 401 if user can\'t sync tables' do
      @user1.sync_tables_enabled = false
      @user1.save

      post_json api_v1_synchronizations_create_url(params) do |r|
        r.status.should eq 401
      end
    end

    it 'creates a synchronization and enqueues a import job' do
      Resque::ImporterJobs.expects(:perform).once
      expect {
        post_json api_v1_synchronizations_create_url(params) do |r|
          r.status.should eq 200
        end
      }.to change { Carto::Synchronization.count }.by 1
    end
  end

  describe '#sync_now' do
    it 'syncs... now :D' do
      sync = FactoryGirl.create(:carto_synchronization, user_id: @user1.id)
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
      sync = FactoryGirl.create(:carto_synchronization, user_id: @user1.id)
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
      sync = FactoryGirl.create(:carto_synchronization, user_id: @user1.id)
      Carto::Synchronization.exists?(sync.id).should be_true
      delete_json api_v1_synchronizations_update_url(id: sync.id) do |r|
        r.status.should eq 204
        Carto::Synchronization.exists?(sync.id).should be_false
      end
    end
  end
end

