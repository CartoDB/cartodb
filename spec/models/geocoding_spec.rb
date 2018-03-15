# encoding: utf-8
require 'spec_helper'
require 'mock_redis'

describe Geocoding do
  before(:all) do
    @user = create_user(geocoding_quota: 200, geocoding_block_price: 1500, geocoder_provider: 'heremaps')

    bypass_named_maps
    @table = FactoryGirl.create(:user_table, user_id: @user.id)
  end

  before(:each) do
    bypass_named_maps
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  describe '#setup' do
    let(:geocoding) { FactoryGirl.create(:geocoding, user: @user, user_table: @table, formatter: 'foo', kind: 'admin0') }

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
      geocoding = FactoryGirl.build(:geocoding, user: @user, user_table: @table, kind: 'high-resolution', formatter: 'foo')
      geocoding.table_geocoder.should be_kind_of(CartoDB::TableGeocoder)
    end

    it 'returns an instance of InternalGeocoder when kind is not high-resolution' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, user_table: @table, kind: 'admin0', geometry_type: 'polygon', formatter: 'foo')
      geocoding.table_geocoder.should be_kind_of(CartoDB::InternalGeocoder::Geocoder)
    end

    it 'memoizes' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, user_table: @table, kind: 'admin0', geometry_type: 'polygon', formatter: 'foo')
      geocoder = geocoding.table_geocoder
      geocoder.should be_kind_of(CartoDB::InternalGeocoder::Geocoder)
      geocoder.should eq geocoding.table_geocoder
    end
  end

  describe '#save' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user, user_table: @table) }

    it 'validates formatter' do
      geocoding.raise_on_save_failure = true
      geocoding.formatter = nil
      expect { geocoding.save }.to raise_error(Sequel::ValidationFailed)
      geocoding.errors[:formatter].join(',').should match /is not present/
    end

    it 'validates kind' do
      geocoding.raise_on_save_failure = true
      geocoding.kind = 'nonsense'
      expect { geocoding.save }.to raise_error(Sequel::ValidationFailed)
      geocoding.errors[:kind].join(',').should match /is not in range or set/
    end

    it 'updates updated_at' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, user_table: @table, formatter: 'b', kind: 'admin0')
      expect { geocoding.save }.to change(geocoding, :updated_at)
    end
  end

  describe '#translate_formatter' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user, user_table: @table) }

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

    it 'marks the geocoding as failed if the geocoding job fails' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, formatter: 'a',
                                    user_table: @table, geometry_type: 'polygon',
                                    kind: 'admin0')
      geocoding.class.stubs(:processable_rows).returns 10
      CartoDB::TableGeocoder.any_instance.stubs(:used_batch_request?).returns false
      CartoDB::TableGeocoder.any_instance.stubs(:run).raises("Error")
      CartoDB.expects(:notify_exception).times(1)

      geocoding.run!
      geocoding.state.should eq 'failed'
    end

    it 'sends a payload with duration information' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, user_table: @table, kind: 'admin0', geometry_type: 'polygon', formatter: 'b')
      geocoding.class.stubs(:processable_rows).returns 10
      CartoDB::InternalGeocoder::Geocoder.any_instance.stubs(:run).returns true
      CartoDB::InternalGeocoder::Geocoder.any_instance.stubs(:process_results).returns true
      CartoDB::InternalGeocoder::Geocoder.any_instance.stubs(:update_geocoding_status).returns(processed_rows: 10, state: 'completed')

      # metrics_payload is sent to the log in json
      Logger.any_instance.expects(:info).once {|str|
        payload = JSON.parse(str)
        payload.has_key?('queue_time') && payload.has_key?('processing_time') && payload['queue_time'] > 0 && payload['processing_time'] > 0
      }

      geocoding.run!
      geocoding.reload.state.should eq 'finished'
    end

    describe 'cartodb_georef_status interactions' do

      before(:each) do
        @my_table = FactoryGirl.create(:user_table, user_id: @user.id)
      end

      after(:each) do
        @my_table.destroy
      end

      it 'marks rows to geocode with cartodb_georef_status = null' do
        geocoding = FactoryGirl.build(:geocoding, user: @user, user_table: @my_table, kind: 'admin0', geometry_type: 'polygon', formatter: 'b')
        geocoding.stubs(:run_geocoding!)
        @my_table.service.add_column!(name: 'cartodb_georef_status', type: 'bool')
        @my_table.service.insert_row!(cartodb_georef_status: nil)
        @my_table.service.insert_row!(cartodb_georef_status: true)
        @my_table.service.insert_row!(cartodb_georef_status: false)

        geocoding.run!
        @my_table.service.sequel.where(cartodb_georef_status: nil).count.should == 2
      end

      it 'sets cartodb_georef_status to null on all rows if force_all_rows=true' do
        geocoding = FactoryGirl.build(:geocoding, user: @user, user_table: @my_table, kind: 'admin0', geometry_type: 'polygon', formatter: 'b', force_all_rows: true)
        geocoding.stubs(:run_geocoding!)
        @my_table.service.add_column!(name: 'cartodb_georef_status', type: 'bool')
        @my_table.service.insert_row!(cartodb_georef_status: nil)
        @my_table.service.insert_row!(cartodb_georef_status: true)
        @my_table.service.insert_row!(cartodb_georef_status: false)

        geocoding.run!
        @my_table.service.sequel.where(cartodb_georef_status: nil).count.should == 3
      end

    end

    it 'succeeds if there are no rows to geocode' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, formatter: 'a',
                                    user_table: @table, geometry_type: 'polygon',
                                    kind: 'admin0')
      geocoding.class.stubs(:processable_rows).returns 0
      geocoding.run!
      geocoding.processed_rows.should eq 0
      geocoding.state.should eq 'finished'
      geocoding.cache_hits.should eq 0
      geocoding.used_credits.should eq 0
    end

    pending 'raises an exception if the geocoding times out' do
      geocoding = FactoryGirl.create(:geocoding, user: @user, user_table: @table, formatter: 'b', kind: 'high-resolution')
      geocoding.class.stubs(:processable_rows).returns 10
      geocoding.stubs(:processing_timeout_seconds).returns 0.01 # set timeout to 10 ms

      table_geocoder_mock = mock
      table_geocoder_mock.stubs(:run).with() { sleep(5) } # force it to sleep beyond timeout
      geocoding.stubs(:table_geocoder).returns(table_geocoder_mock)

      geocoding.run!
      geocoding.reload.state.should eq 'failed'
    end

    it 'sends a track event through hubspot client' do
      hubspot_instance = CartoDB::Hubspot.instance
      hubspot_instance.expects(:track_geocoding_success).once.with() { |payload|
        payload[:email] == @user.email && payload[:processed_rows] == 0
      }

      geocoding = FactoryGirl.build(:geocoding, user: @user, formatter: 'a',
                                    user_table: @table, geometry_type: 'polygon',
                                    kind: 'admin0')
      geocoding.class.stubs(:processable_rows).returns 0
      geocoding.run!
    end
  end

  describe '#max_geocodable_rows' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user) }

    it 'returns the remaining quota if the user has hard limit' do
      @user.stubs('hard_geocoding_limit?').returns(true)
      delete_user_data @user
      geocoding.max_geocodable_rows.should eq 200
      user_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(@user.username, nil)
      user_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)
      geocoding.max_geocodable_rows.should eq 100
    end

    it 'returns 50000 if the user has soft limit' do
      @user.stubs('soft_geocoding_limit?').returns(true)
      user_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(@user.username, nil)
      user_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)
      geocoding.max_geocodable_rows.should eq 50000
    end

    it 'returns the remaining quota for the organization if the user has hard limit and belongs to an org' do
      organization = create_organization_with_users(geocoding_quota: 150)
      organization.owner.geocoder_provider = 'heremaps'
      organization.owner.save.reload
      org_user = organization.users.last
      org_user.stubs('soft_geocoding_limit?').returns(false)
      org_geocoding = FactoryGirl.build(:geocoding, user: org_user)
      organization.geocoding_quota.should eq 150
      org_geocoding.max_geocodable_rows.should eq 150
      org_user_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(org_user.username, organization.name)
      org_user_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)
      org_geocoding.max_geocodable_rows.should eq 50
      organization.destroy
    end

  end

  describe '#cancel' do
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user, user_table: @table, formatter: 'foo', kind: 'high-resolution') }

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

  describe '#calculate_used_credits' do
    before(:each) do
      @user.geocodings_dataset.delete
    end

    it 'returns 0 when the geocode is not high-resolution' do
      geocoding = FactoryGirl.create(:geocoding, user: @user, kind: 'admin0', processed_rows: 10500, formatter: 'foo')
      geocoding.calculate_used_credits.should eq 0
    end

    it 'returns 0 when the user has enough quota' do
      # User has 200 geocoding credits, so geocoding 200 strings should take 0 credits
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 0, cache_hits: 200, kind: 'high-resolution', formatter: 'foo')
      geocoding.calculate_used_credits.should eq 0
    end

    it 'returns the used credits when the user is over geocoding quota' do
      redis_mock = MockRedis.new
      user_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(@user.username, _org = nil, _redis = redis_mock)
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(user_geocoder_metrics)
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 0, cache_hits: 100, kind: 'high-resolution', geocoder_type: 'heremaps', formatter: 'foo')
      user_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)
      # 100 total (user has 200) => 0 used credits
      geocoding.calculate_used_credits.should eq 0
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 0, cache_hits: 150, kind: 'high-resolution', geocoder_type: 'heremaps', formatter: 'foo')
      user_geocoder_metrics.incr(:geocoder_cache, :success_responses, 150)
      # 250 total => 50 used credits
      geocoding.calculate_used_credits.should eq 50
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 100, cache_hits: 0, kind: 'high-resolution', geocoder_type: 'heremaps', formatter: 'foo')
      user_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)
      # 350 total => 100 used credits
      geocoding.calculate_used_credits.should eq 100
    end
  end

  describe '#price' do
    it 'returns 0 when the job used no credits' do
      geocoding = FactoryGirl.create(:geocoding, user: @user, used_credits: 0, formatter: 'foo', kind: 'admin0')
      geocoding.price.should eq 0
    end

    it 'returns the expected price when the geocoding used some credits' do
      geocoding = FactoryGirl.create(:geocoding, user: @user, used_credits: 100, formatter: 'foo', kind: 'high-resolution')
      geocoding.price.should eq 150
      geocoding = FactoryGirl.create(:geocoding, user: @user, used_credits: 3, formatter: 'foo', kind: 'high-resolution')
      geocoding.price.should eq 4.5
    end
  end

  describe 'self.processable_rows' do
    before(:each) do
      @my_table = FactoryGirl.create(:user_table, user_id: @user.id)
    end

    after(:each) do
      @my_table.destroy
    end

    it "returns all rows if there's no cartodb_georef_status column" do
      3.times { @my_table.service.insert_row!({}) }
      Geocoding.processable_rows(@my_table.service).should == 3
    end

    it "returns all rows where cartodb_georef_status <> true" do
      @my_table.service.add_column!(name: 'cartodb_georef_status', type: 'bool')
      3.times { @my_table.service.insert_row!(cartodb_georef_status: nil) }
      @my_table.service.insert_row!(cartodb_georef_status: true)
      @my_table.service.insert_row!(cartodb_georef_status: false)
      Geocoding.processable_rows(@my_table.service).should == 4
    end

    it "returns all rows regardless of cartodb_georef_status if force_all_rows=true" do
      @my_table.service.add_column!(name: 'cartodb_georef_status', type: 'bool')
      3.times { @my_table.service.insert_row!(cartodb_georef_status: nil) }
      @my_table.service.insert_row!(cartodb_georef_status: true)
      @my_table.service.insert_row!(cartodb_georef_status: false)
      Geocoding.processable_rows(@my_table.service, true).should == 5
    end

  end

  describe '#failed_rows and #successful_rows' do
    before(:each) do
      @user.geocodings_dataset.delete
    end
    it 'returns expected results' do
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 0, cache_hits: 100, real_rows: 100, processable_rows: 100, kind: 'high-resolution', formatter: 'foo')
      geocoding.failed_rows.should eq 0
      geocoding.successful_rows.should eq 100
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 10, cache_hits: 150, real_rows: 155, processable_rows: 160, kind: 'high-resolution', formatter: 'foo')
      geocoding.failed_rows.should eq 5
      geocoding.successful_rows.should eq 155
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 100, cache_hits: 0, real_rows: 100, processable_rows: 100, kind: 'high-resolution', formatter: 'foo')
      geocoding.failed_rows.should eq 0
      geocoding.successful_rows.should eq 100
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 0, cache_hits: 0, real_rows: 0, processable_rows: 0, kind: 'high-resolution', formatter: 'foo')
      geocoding.failed_rows.should eq 0
      geocoding.successful_rows.should eq 0
      geocoding = FactoryGirl.create(:geocoding, user: @user, processed_rows: 100, cache_hits: 0, real_rows: 0, processable_rows: 100, kind: 'high-resolution', formatter: 'foo')
      geocoding.failed_rows.should eq 100
      geocoding.successful_rows.should eq 0
    end
  end

end
