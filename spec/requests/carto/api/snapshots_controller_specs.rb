# encoding utf-8

require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'

describe Carto::Api::SnapshotsController do
  include Carto::Factories::Visualizations
  include HelperMethods

  let(:fake_state) { { manolo: 'escobar' } }

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @intruder = FactoryGirl.create(:carto_user)
    @_m, @_t, @_tv, @visualization = create_full_visualization(@user)
    @_om, @_ot, @_otv, @other_visualization = create_full_visualization(@user)
  end

  after(:all) do
    destroy_full_visualzation(@_m, @_t, @_tv, @visualization)
    destroy_full_visualzation(@_om, @_ot, @_otv, @other_visualization)
    @intruder.destroy
    @user.destroy
  end

  describe('#index') do
    def snapshots_index_url(user_domain: @user.subdomain,
                            visualization_id: @visualization.id,
                            api_key: @user.api_key)
      snapshots_url(user_domain: user_domain,
                    visualization_id: visualization_id,
                    api_key: api_key)
    end

    before(:all) do
      5.times do
        Carto::State.create!(user_id: @user.id,
                             visualization_id: @visualization.id,
                             state: fake_state)
      end

      @buddy = FactoryGirl.create(:carto_user)
      5.times do
        Carto::State.create!(user_id: @buddy.id,
                             visualization_id: @visualization.id,
                             state: fake_state)
      end

      5.times do
        Carto::State.create!(user_id: @buddy.id,
                             visualization_id: @other_visualization.id,
                             state: fake_state)
      end
    end

    after(:all) do
      Carto::State.where(user_id: @user.id).map(&:destroy)
      Carto::State.where(user_id: @buddy.id).map(&:destroy)

      @buddy.destroy
    end

    it 'rejects unauthenticated access' do
      Carto::Visualization.any_instance
                          .stubs(:is_publically_accesible?)
                          .returns(false)

      get_json(snapshots_index_url(api_key: nil), Hash.new) do |response|
        response.status.should eq 401
      end
    end

    it 'rejects users with no read access' do
      Carto::Visualization.any_instance
                          .stubs(:is_viewable_by_user?)
                          .returns(false)

      intruder_url = snapshots_index_url(user_domain: @intruder.subdomain,
                                         api_key: @intruder.api_key)
      get_json(intruder_url, Hash.new) do |response|
        response.status.should eq 403
      end
    end

    it 'returns 404 for non existent visualizations' do
      not_found_url = snapshots_index_url(visualization_id: random_uuid)
      get_json(not_found_url, Hash.new) do |response|
        response.status.should eq 404
      end
    end

    it 'should not list visualization state for owner' do
      get_json(snapshots_index_url, Hash.new) do |response|
        response.status.should eq 200

        response_ids = response.body
                               .map { |snapshot| snapshot['id'] }
                               .compact
                               .sort
        response_ids.should_not be_empty

        response_ids.should_not include(@visualization.id)
      end
    end

    it 'lists only snapshots for user and visualization' do
      buddy_url = snapshots_index_url(user_domain: @buddy.subdomain,
                                      api_key: @buddy.api_key)

      buddy_snaps_for_viz = Carto::State.where(user_id: @buddy.id,
                                               visualization_id: @visualization.id)
                                        .map(&:id)
                                        .sort

      get_json(buddy_url, Hash.new) do |response|
        response.status.should eq 200

        response_ids = response.body
                               .map { |snapshot| snapshot['id'] }
                               .compact
                               .sort
        response_ids.should_not be_empty

        response_ids.should eq buddy_snaps_for_viz
      end
    end
  end

  describe('#show') do
    def snapshots_show_url(user_domain: @user.subdomain,
                           visualization_id: @visualization.id,
                           snapshot_id: @snapshot.id,
                           api_key: @user.api_key)
      snapshot_url(user_domain: user_domain,
                   visualization_id: visualization_id,
                   id: snapshot_id,
                   api_key: api_key)
    end

    before(:all) do
      @snapshot = Carto::State.create!(user_id: @user.id,
                                       visualization_id: @visualization.id,
                                       state: fake_state)
    end

    after(:all) do
      @snapshot.destroy
    end

    it 'rejects unauthenticated access' do
      Carto::Visualization.any_instance
                          .stubs(:is_publically_accesible?)
                          .returns(false)

      get_json(snapshots_show_url(api_key: nil), Hash.new) do |response|
        response.status.should eq 401
      end
    end

    it 'rejects users with no read access' do
      Carto::Visualization.any_instance
                          .stubs(:is_viewable_by_user?)
                          .returns(false)

      intruder_url = snapshots_show_url(user_domain: @intruder.subdomain,
                                        api_key: @intruder.api_key)
      get_json(intruder_url, Hash.new) do |response|
        response.status.should eq 403
      end
    end

    it 'returns 404 for non existent visualizations' do
      not_found_url = snapshots_show_url(visualization_id: random_uuid)
      get_json(not_found_url, Hash.new) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for inexistent snapshots' do
      not_found_url = snapshots_show_url(snapshot_id: random_uuid)

      get_json(not_found_url, Hash.new) do |response|
        response.status.should eq 404
      end
    end

    it 'only accepts owners of snapshots' do
      intruder_url = snapshots_show_url(user_domain: @intruder.subdomain,
                                        api_key: @intruder.api_key)
      get_json(intruder_url, Hash.new) do |response|
        response.status.should eq 403
      end
    end

    it 'shows a snapshot' do
      get_json(snapshots_show_url, Hash.new) do |response|
        response.status.should eq 200
        response.body[:id].should eq @snapshot.id
      end
    end
  end

  describe('#create') do
    def snapshots_create_url(user_domain: @user.subdomain,
                             visualization_id: @visualization.id,
                             api_key: @user.api_key)
      snapshots_url(user_domain: user_domain,
                    visualization_id: visualization_id,
                    api_key: api_key)
    end

    before(:each) do
      @user.visualizations.map(&:snapshots).flatten.map(&:destroy)
    end

    after(:all) do
      @user.visualizations.map(&:snapshots).flatten.map(&:destroy)
    end

    it 'rejects unauthenticated access' do
      Carto::Visualization.any_instance
                          .stubs(:is_publically_accesible?)
                          .returns(false)

      post_json(snapshots_create_url(api_key: nil), state: fake_state) do |response|
        response.status.should eq 401
      end
    end

    it 'rejects users with no read access' do
      Carto::Visualization.any_instance
                          .stubs(:is_viewable_by_user?)
                          .returns(false)

      intruder_url = snapshots_create_url(user_domain: @intruder.subdomain,
                                          api_key: @intruder.api_key)
      post_json(intruder_url, state: fake_state) do |response|
        response.status.should eq 403
      end
    end

    it 'returns 404 for non existent visualizations' do
      not_found_url = snapshots_create_url(visualization_id: random_uuid)
      post_json(not_found_url, state: fake_state) do |response|
        response.status.should eq 404
      end
    end

    it 'creates a snapshot' do
      @visualization.snapshots.count.should eq 0

      post_json(snapshots_create_url, state: fake_state) do |response|
        response.status.should eq 201

        @visualization.reload

        @visualization.snapshots.count.should eq 1
        @visualization.snapshots.first.id.should eq response.body[:id]
      end
    end
  end

  describe('#update') do
    def snapshots_update_url(user_domain: @user.subdomain,
                             visualization_id: @visualization.id,
                             snapshot_id: @snapshot.id,
                             api_key: @user.api_key)
      snapshot_url(user_domain: user_domain,
                   visualization_id: visualization_id,
                   id: snapshot_id,
                   api_key: api_key)
    end

    before(:all) do
      @snapshot = Carto::State.create!(user_id: @user.id,
                                       visualization_id: @visualization.id,
                                       state: fake_state)
    end

    after(:all) do
      @snapshot.destroy
    end

    it 'rejects unauthenticated access' do
      Carto::Visualization.any_instance
                          .stubs(:is_publically_accesible?)
                          .returns(false)

      put_json(snapshots_update_url(api_key: nil), Hash.new) do |response|
        response.status.should eq 401
      end
    end

    it 'rejects users with no read access' do
      Carto::Visualization.any_instance
                          .stubs(:is_viewable_by_user?)
                          .returns(false)

      intruder_url = snapshots_update_url(user_domain: @intruder.subdomain,
                                          api_key: @intruder.api_key)
      put_json(intruder_url, Hash.new) do |response|
        response.status.should eq 403
      end
    end

    it 'returns 404 for non existent visualizations' do
      not_found_url = snapshots_update_url(visualization_id: random_uuid)
      put_json(not_found_url, Hash.new) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for inexistent snapshots' do
      not_found_url = snapshots_update_url(snapshot_id: random_uuid)

      put_json(not_found_url, Hash.new) do |response|
        response.status.should eq 404
      end
    end

    it 'only accepts owners of snapshots' do
      intruder_url = snapshots_update_url(user_domain: @intruder.subdomain,
                                          api_key: @intruder.api_key)
      put_json(intruder_url, Hash.new) do |response|
        response.status.should eq 403
      end
    end

    it 'updates a snapshot' do
      new_state = { minili: 'iscibir' }

      put_json(snapshots_update_url, state: new_state) do |response|
        response.status.should eq 200
      end

      @snapshot.reload.json.should eq new_state
    end
  end

  describe('#destroy') do
    def snapshots_update_url(user_domain: @user.subdomain,
                             visualization_id: @visualization.id,
                             snapshot_id: @snapshot.id,
                             api_key: @user.api_key)
      snapshot_url(user_domain: user_domain,
                   visualization_id: visualization_id,
                   id: snapshot_id,
                   api_key: api_key)
    end

    before(:each) do
      @snapshot = Carto::State.create!(user_id: @user.id,
                                       visualization_id: @visualization.id,
                                       state: fake_state)
    end

    after(:each) do
      @snapshot.destroy
    end

    it 'rejects unauthenticated access' do
      Carto::Visualization.any_instance
                          .stubs(:is_publically_accesible?)
                          .returns(false)

      delete_json(snapshots_update_url(api_key: nil), Hash.new) do |response|
        response.status.should eq 401
      end
    end

    it 'rejects users with no read access' do
      Carto::Visualization.any_instance
                          .stubs(:is_viewable_by_user?)
                          .returns(false)

      intruder_url = snapshots_update_url(user_domain: @intruder.subdomain,
                                          api_key: @intruder.api_key)
      delete_json(intruder_url, Hash.new) do |response|
        response.status.should eq 403
      end
    end

    it 'returns 404 for non existent visualizations' do
      not_found_url = snapshots_update_url(visualization_id: random_uuid)
      delete_json(not_found_url, Hash.new) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 404 for inexistent snapshots' do
      not_found_url = snapshots_update_url(snapshot_id: random_uuid)

      delete_json(not_found_url, Hash.new) do |response|
        response.status.should eq 404
      end
    end

    it 'only accepts owners of snapshots' do
      intruder_url = snapshots_update_url(user_domain: @intruder.subdomain,
                                          api_key: @intruder.api_key)
      delete_json(intruder_url, Hash.new) do |response|
        response.status.should eq 403
      end
    end

    it 'destroys a snapshot' do
      delete_json(snapshots_update_url, Hash.new) do |response|
        response.status.should eq 204
      end
    end
  end
end
