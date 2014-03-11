#encoding: UTF-8
require 'spec_helper'

describe Geocoding do
  before(:all) do
    @user  = create_user(geocoding_quota: 200)
    @table = FactoryGirl.create(:table, user_id: @user.id)
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
  end

  describe '#setup' do
    let(:geocoding) { FactoryGirl.create(:geocoding, user: @user, table: @table) }

    it 'sets default timestamps value' do
      geocoding.created_at.should_not be_nil
      geocoding.updated_at.should_not be_nil
    end

    it 'links user and geocoding' do
      geocoding.user.should eq @user
    end
  end

  describe '#table_geocoder' do
    it 'returns an instance of TableGeocoder when kind is high-resolution' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, table: @table, kind: 'high-resolution')
      geocoding.table_geocoder.should be_kind_of(CartoDB::TableGeocoder)
    end

    it 'returns an instance of InternalGeocoder when kind is not high-resolution' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, table: @table, kind: 'admin0')
      geocoding.table_geocoder.should be_kind_of(CartoDB::InternalGeocoder)
    end

    it 'memoizes' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, table: @table, kind: 'admin0')
      geocoder = geocoding.table_geocoder
      geocoder.should be_kind_of(CartoDB::InternalGeocoder)
      geocoder.should eq geocoding.table_geocoder
    end
  end

  describe '#save' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user, table: @table) }

    it 'validates formatter' do
      expect { geocoding.save }.to raise_error(Sequel::ValidationFailed)
      geocoding.errors[:formatter].join(',').should match /is not present/
    end

    it 'validates kind' do
      geocoding.kind = 'nonsense'
      expect { geocoding.save }.to raise_error(Sequel::ValidationFailed)
      geocoding.errors[:kind].join(',').should match /is not in range or set/
    end

    it 'updates updated_at' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, table: @table, formatter: 'b', kind: 'admin0')
      expect { geocoding.save }.to change(geocoding, :updated_at)
    end
  end

  describe '#translate_formatter' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user, table: @table) }

    it 'translates a string with field names' do
      geocoding.formatter = '{a}, {b}'
      geocoding.translate_formatter.should == "a, ', ', b"
    end

    it 'translates a string with literals' do
      geocoding.formatter = 'c'
      geocoding.translate_formatter.should == "'c'"
    end

    it 'translates a string with mixed literals and field names' do
      geocoding.formatter = '{a}, b, {c}'
      geocoding.translate_formatter.should == "a, ', b, ', c"
    end
  end

  describe '#run!' do
    it 'updates processed_rows, cache_hits and state' do
      geocoding = FactoryGirl.create(:geocoding, user: @user, table: @table, formatter: 'b')
      geocoding.table_geocoder.stubs(:run).returns true
      geocoding.table_geocoder.stubs(:cache).returns  OpenStruct.new(hits: 5)
      geocoding.table_geocoder.stubs(:process_results).returns true
      CartoDB::Geocoder.any_instance.stubs(:status).returns 'completed'
      CartoDB::Geocoder.any_instance.stubs(:update_status).returns true
      CartoDB::Geocoder.any_instance.stubs(:processed_rows).returns 10
      geocoding.run!
      geocoding.processed_rows.should eq 10
      geocoding.state.should eq 'finished'
      geocoding.cache_hits.should eq 5
    end

    it 'marks the geocoding as failed if the geocoding job fails' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, formatter: 'a', table: @table, formatter: 'b')
      CartoDB::TableGeocoder.any_instance.stubs(:run).raises("Error")
      CartoDB.expects(:notify_exception).times(1)

      geocoding.run!
      geocoding.state.should eq 'failed'
    end

    it 'raises a timeout error if geocoding takes more than 15 minutes to start' do
      geocoding = FactoryGirl.create(:geocoding, user: @user, table: @table, formatter: 'b')
      CartoDB::TableGeocoder.any_instance.stubs(:run).returns true
      CartoDB::TableGeocoder.any_instance.stubs(:process_results).returns true
      CartoDB::Geocoder.any_instance.stubs(:status).returns 'submitted'
      CartoDB::Geocoder.any_instance.stubs(:update_status).returns true
      geocoding.run_timeout = 0.1
      geocoding.run!
      geocoding.reload.state.should eq 'failed'
      geocoding.run_timeout = Geocoding::DEFAULT_TIMEOUT
    end

    pending 'creates an automatic geocoder' do
      geocoding = Geocoding.create(user: @user, table: @table, formatter: 'b')
      CartoDB::TableGeocoder.any_instance.stubs(:run).returns true
      CartoDB::TableGeocoder.any_instance.stubs(:process_results).returns true
      CartoDB::Geocoder.any_instance.stubs(:status).returns 'completed'
      CartoDB::Geocoder.any_instance.stubs(:update_status).returns true
      CartoDB.expects(:notify_exception).once.returns(true)
      expect { geocoding.run! }.to change { AutomaticGeocoding.count }.by(1)
      geocoding.automatic_geocoding_id.should_not be_nil
    end
  end

  describe '#max_geocodable_rows' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user) }

    it 'returns the remaining quota if the user has hard limit' do
      @user.stubs('hard_geocoding_limit?').returns(true)
      delete_user_data @user
      geocoding.max_geocodable_rows.should eq 200
      FactoryGirl.create(:geocoding, user: @user, processed_rows: 100)
      geocoding.max_geocodable_rows.should eq 100
    end

    it 'returns nil if the user has soft limit' do
      @user.stubs('hard_geocoding_limit?').returns(false)
      FactoryGirl.create(:geocoding, user: @user, processed_rows: 100)
      geocoding.max_geocodable_rows.should eq nil      
    end
  end

  describe '#cancel' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user) }

    it 'cancels the geocoding job' do
      geocoding.table_geocoder.expects(:cancel).times(1).returns(true)
      geocoding.cancel
    end

    it 'tries 5 times to cancel the geocoding job if that fails and after that sends an error report' do
      CartoDB.expects(:notify_exception).times(1)
      geocoding.table_geocoder.expects(:cancel).times(5).raises("error")
      geocoding.cancel
    end
  end

end
