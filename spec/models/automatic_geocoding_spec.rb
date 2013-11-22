#encoding: UTF-8
require 'spec_helper'

describe AutomaticGeocoding do
  before(:all) do
    @user  = create_user(geocoding_quota: 200)
    @table = FactoryGirl.create(:table, user_id: @user.id)
  end

  describe '#setup' do
    let(:geocoding) { FactoryGirl.create(:automatic_geocoding, table: @table) }

    it 'sets default values' do
      geocoding.created_at.should_not be_nil
      geocoding.updated_at.should_not be_nil
      geocoding.ran_at.should_not be_nil
      geocoding.state.should eq 'created'
    end

    it 'links table and geocoding' do
      geocoding.table.should eq @table
      @table.automatic_geocoding.should eq geocoding
    end
  end

  describe '#run' do
    let(:automatic_geocoding) { FactoryGirl.create(:automatic_geocoding, table: @table) }
    let(:geocoding) { FactoryGirl.create(:automatic_geocoding, table: @table, formatter: 'wadus', user: @user, automatic_geocoding: automatic_geocoding) }

    it 'creates a new geocoding' do
      Geocoding.any_instance.expects('run!').once.returns(true)
      expect { automatic_geocoding.run }.to increase { Geocoding.count }.by(1)
    end
  end
end
