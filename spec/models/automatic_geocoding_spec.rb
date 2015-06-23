#encoding: UTF-8
require 'spec_helper'

describe AutomaticGeocoding do
  before(:all) do
    @user  = create_user(geocoding_quota: 200)

    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
    @table = FactoryGirl.create(:table, user_id: @user.id)
  end

  after(:all) do
    @user.destroy
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
  end # setup

  describe '#run' do
    let(:automatic_geocoding) { FactoryGirl.create(:automatic_geocoding, table: @table) }

    it 'creates a new geocoding' do
      FactoryGirl.create(:geocoding, table: @table, formatter: 'wadus', user: @user, automatic_geocoding_id: automatic_geocoding.id)
      Geocoding.any_instance.expects('run!').once.returns(true)
      expect { automatic_geocoding.run }.to change { Geocoding.count }.by(1)
    end

    it 'updates ran_at' do
      FactoryGirl.create(:geocoding, table: @table, formatter: 'wadus', user: @user, automatic_geocoding_id: automatic_geocoding.id)
      Geocoding.any_instance.expects('run!').once.returns(true)
      expect { automatic_geocoding.run }.to change { automatic_geocoding.ran_at }
    end

    it 'updates the state' do
      FactoryGirl.create(:geocoding, table: @table, formatter: 'wadus', user: @user, automatic_geocoding_id: automatic_geocoding.id)
      Geocoding.any_instance.expects('run!').once.returns(true)
      expect { automatic_geocoding.run }.to change { automatic_geocoding.state }.to('idle')
    end

    it 'marks the geocoding as failed after some retries' do
      FactoryGirl.create(:geocoding, table: @table, formatter: 'wadus', user: @user, automatic_geocoding_id: automatic_geocoding.id)
      Geocoding.any_instance.stubs('run!').raises("error")
      expect { 5.times { automatic_geocoding.run } }.to change { automatic_geocoding.retried_times.to_i }.by(5)
      expect { automatic_geocoding.run }.to raise_error(Exception)
    end
  end # run

  describe '#active' do
    it 'returns automatic geocodings whose tables have changed' do
      g = FactoryGirl.create(:automatic_geocoding, table: @table)
      Table.any_instance.stubs(:data_last_modified).returns 1.month.from_now
      AutomaticGeocoding.active.count.should eq 0
      g.update state: 'idle'
      AutomaticGeocoding.active.count.should eq 1
    end
  end
end
