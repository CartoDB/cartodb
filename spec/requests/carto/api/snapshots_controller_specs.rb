# encoding utf-8

require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'

describe Carto::Api::SnapshotsController do
  include Carto::Factories::Visualizations
  include HelperMethods

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @intruder = FactoryGirl.create(:carto_user)
    @_m, @_t, @_tv, @visualization = create_full_visualization(@user)
    @_m, @_t, @_tv, @other_visualization = create_full_visualization(@user)
  end

  after(:all) do
    destroy_full_visualzation(@_m, @_t, @_tv, @visualization)
    destroy_full_visualzation(@_m, @_t, @_tv, @other_visualization)
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
                             json: { manolo: 'escobar' })
      end

      @fellow = FactoryGirl.create(:carto_user)
      5.times do
        Carto::State.create!(user_id: @fellow.id,
                             visualization_id: @visualization.id,
                             json: { manolo: 'escobar' })
      end

      5.times do
        Carto::State.create!(user_id: @fellow.id,
                             visualization_id: @other_visualization.id,
                             json: { manolo: 'escobar' })
      end
    end

    after(:all) do
      Carto::State.where(user_id: @user.id).map(&:destroy)
      Carto::State.where(user_id: @fellow.id).map(&:destroy)

      @fellow.destroy
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

    it 'should list only snapshots for user and visualization' do
      fellow_url = snapshots_index_url(user_domain: @fellow.subdomain,
                                       api_key: @fellow.api_key)

      fellow_snaps_for_viz = Carto::State.where(user_id: @fellow.id,
                                                visualization_id: @visualization.id)
                                         .map(&:id)
                                         .sort

      get_json(fellow_url, Hash.new) do |response|
        response.status.should eq 200

        response_ids = response.body
                               .map { |snapshot| snapshot['id'] }
                               .compact
                               .sort
        response_ids.should_not be_empty

        response_ids.should eq fellow_snaps_for_viz
      end
    end
  end
end
