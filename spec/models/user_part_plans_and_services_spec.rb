require_relative '../spec_helper'
require 'helpers/rate_limits_helper'
require 'helpers/user_part_helper'

describe User do
  include UserPartHelper
  include RateLimitsHelper
  include_context 'user spec configuration'

  it "should correctly identify last billing cycle" do
    user = create_user :email => 'example@example.com', :username => 'example', :password => 'testingbilling'
    Delorean.time_travel_to(Date.parse("2013-01-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-15"))
      user.last_billing_cycle.should == Date.parse("2012-12-15")
    end
    Delorean.time_travel_to(Date.parse("2013-01-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-02"))
      user.last_billing_cycle.should == Date.parse("2012-12-02")
    end
    Delorean.time_travel_to(Date.parse("2013-03-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-31"))
      user.last_billing_cycle.should == Date.parse("2013-02-28")
    end
    Delorean.time_travel_to(Date.parse("2013-03-15")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-02"))
      user.last_billing_cycle.should == Date.parse("2013-03-02")
    end
    user.destroy
    Delorean.back_to_the_present
  end

  it "should update remaining quotas when adding or removing tables" do
    initial_quota = @user2.remaining_quota

    expect { create_table :user_id => @user2.id, :privacy => UserTable::PRIVACY_PUBLIC }
      .to change { @user2.remaining_table_quota }.by(-1)

    table = Table.new(user_table: UserTable.filter(:user_id => @user2.id).first)
    50.times { |i| table.insert_row!(:name => "row #{i}") }

    @user2.remaining_quota.should be < initial_quota

    initial_quota = @user2.remaining_quota

    expect { table.destroy }
      .to change { @user2.remaining_table_quota }.by(1)
    @user2.remaining_quota.should be > initial_quota
  end

  it "should rebuild the quota trigger after changing the quota" do
    @user.db_service.expects(:rebuild_quota_trigger).once
    @user.quota_in_bytes = @user.quota_in_bytes + 1.megabytes
    @user.save
  end

  describe '#rate limits' do
    before :all do
      @account_type = create_account_type_fg('FREE')
      @account_type_pro = create_account_type_fg('PRO')
      @account_type_org = create_account_type_fg('ORGANIZATION USER')
      @rate_limits_custom = FactoryGirl.create(:rate_limits_custom)
      @rate_limits = FactoryGirl.create(:rate_limits)
      @rate_limits_pro = FactoryGirl.create(:rate_limits_pro)
      @user_rt = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits.id)
      @organization = FactoryGirl.create(:organization)

      owner = FactoryGirl.create(:user, account_type: 'PRO')
      uo = CartoDB::UserOrganization.new(@organization.id, owner.id)
      uo.promote_user_to_admin
      @organization.reload
      @user_org = FactoryGirl.build(:user, account_type: 'FREE')
      @user_org.organization = @organization
      @user_org.enabled = true
      @user_org.save

      @map_prefix = "limits:rate:store:#{@user_rt.username}:maps:"
      @sql_prefix = "limits:rate:store:#{@user_rt.username}:sql:"
    end

    after :all do
      @user_rt.destroy unless @user_rt.nil?
      @user_no_ff.destroy unless @user_no_ff.nil?
      @organization.destroy unless @organization.nil?
      @account_type.destroy unless @account_type.nil?
      @account_type_pro.destroy unless @account_type_pro.nil?
      @account_type_org.destroy unless @account_type_org.nil?
      @account_type.rate_limit.destroy unless @account_type.nil?
      @account_type_pro.rate_limit.destroy unless @account_type_pro.nil?
      @account_type_org.rate_limit.destroy unless @account_type_org.nil?
      @rate_limits.destroy unless @rate_limits.nil?
      @rate_limits_custom.destroy unless @rate_limits_custom.nil?
      @rate_limits_custom2.destroy unless @rate_limits_custom2.nil?
      @rate_limits_pro.destroy unless @rate_limits_pro.nil?
    end

    it 'does create rate limits' do
      @user_no_ff = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits.id)
      map_prefix = "limits:rate:store:#{@user_no_ff.username}:maps:"
      sql_prefix = "limits:rate:store:#{@user_no_ff.username}:sql:"
      $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 1
      $limits_metadata.EXISTS("#{sql_prefix}query").should eq 1
    end

    it 'creates rate limits from user account type' do
      expect_rate_limits_saved_to_redis(@user_rt.username)
    end

    it 'updates rate limits from user custom rate_limit' do
      expect_rate_limits_saved_to_redis(@user_rt.username)

      @user_rt.rate_limit_id = @rate_limits_custom.id
      @user_rt.save

      expect_rate_limits_custom_saved_to_redis(@user_rt.username)
    end

    it 'creates rate limits for a org user' do
      expect_rate_limits_pro_saved_to_redis(@user_org.username)
    end

    it 'destroy rate limits' do
      user2 = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits_pro.id)

      expect_rate_limits_pro_saved_to_redis(user2.username)

      user2.destroy

      expect {
        Carto::RateLimit.find(user2.rate_limit_id)
      }.to raise_error(ActiveRecord::RecordNotFound)

      expect_rate_limits_exist(user2.username)
    end

    it 'updates rate limits when user has no rate limits' do
      user = FactoryGirl.create(:valid_user)
      user.update_rate_limits(@rate_limits.api_attributes)

      user.reload
      user.rate_limit.should_not be_nil
      user.rate_limit.api_attributes.should eq @rate_limits.api_attributes

      user.destroy
    end

    it 'does nothing when user has no rate limits' do
      user = FactoryGirl.create(:valid_user)
      user.update_rate_limits(nil)

      user.reload
      user.rate_limit.should be_nil

      user.destroy
    end

    it 'updates rate limits when user has rate limits' do
      @rate_limits_custom2 = FactoryGirl.create(:rate_limits_custom2)
      user = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits_custom2.id)
      user.update_rate_limits(@rate_limits.api_attributes)
      user.reload
      user.rate_limit.should_not be_nil
      user.rate_limit_id.should eq @rate_limits_custom2.id
      user.rate_limit.api_attributes.should eq @rate_limits.api_attributes
      @rate_limits.api_attributes.should eq @rate_limits_custom2.reload.api_attributes

      user.destroy
    end

    it 'set rate limits to nil when user has rate limits' do
      @rate_limits_custom2 = FactoryGirl.create(:rate_limits_custom2)
      user = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits_custom2.id)

      user.update_rate_limits(nil)

      user.reload
      user.rate_limit.should be_nil

      expect {
        Carto::RateLimit.find(@rate_limits_custom2.id)
      }.to raise_error(ActiveRecord::RecordNotFound)

      # limits reverted to the ones from the account type
      expect_rate_limits_saved_to_redis(user.username)

      user.destroy
    end
  end

  it "should read api calls from external service" do
    pending "This is deprecated. This code has been moved"
    @user.stubs(:get_old_api_calls).returns({
                                              "per_day" => [0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 17, 4, 0, 0, 0, 0],
                                              "total"=>49,
                                              "updated_at"=>1370362756
                                            })
    @user.stubs(:get_es_api_calls_from_redis).returns([
                                                        21, 0, 0, 0, 2, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 8, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                                                      ])
    @user.get_api_calls.should == [21, 0, 0, 0, 6, 17, 0, 5, 0, 0, 0, 0, 0, 0, 8, 8, 0, 5, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0]
    @user.get_api_calls(
      from: (Date.today - 6.days),
      to: Date.today
    ).should == [21, 0, 0, 0, 6, 17, 0]
  end

  it "should get final api calls from es" do
    yesterday = Date.today - 1
    today = Date.today
    from_date = DateTime.new(yesterday.year, yesterday.month, yesterday.day, 0, 0, 0).strftime("%Q")
    to_date = DateTime.new(today.year, today.month, today.day, 0, 0, 0).strftime("%Q")
    api_url = %r{search}
    api_response = {
      "aggregations" => {
        "0" => {
          "buckets" => [
            {
              "key" => from_date.to_i,
              "doc_count" => 4
            },
            {
              "key" => to_date.to_i,
              "doc_count" => 6
            }
          ]
        }
      }
    }
    Typhoeus.stub(api_url,
                  { method: :post }
    )
      .and_return(
        Typhoeus::Response.new(code: 200, body: api_response.to_json.to_s)
      )
    @user.get_api_calls_from_es.should == {from_date.to_i => 4, to_date.to_i => 6}
  end

  describe '#get_geocoding_calls' do
    before do
      delete_user_data @user
      @user.geocoder_provider = 'heremaps'
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::GeocoderUsageMetrics.new(@user.username, nil, @mock_redis)
      @usage_metrics.incr(:geocoder_here, :success_responses, 1, Time.now)
      @usage_metrics.incr(:geocoder_internal, :success_responses, 1, Time.now)
      @usage_metrics.incr(:geocoder_here, :success_responses, 1, Time.now - 5.days)
      @usage_metrics.incr(:geocoder_cache, :success_responses, 1, Time.now - 5.days)
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(@usage_metrics)
    end

    it "should return the sum of geocoded rows for the current billing period" do
      @user.get_geocoding_calls.should eq 1
    end

    it "should return the sum of geocoded rows for the specified period" do
      @user.get_geocoding_calls(from: Time.now-5.days).should eq 3
      @user.get_geocoding_calls(from: Time.now-5.days, to: Time.now - 2.days).should eq 2
    end

    it "should return 0 when no geocodings" do
      @user.get_geocoding_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe '#get_here_isolines_calls' do
    before do
      delete_user_data @user
      @user.isolines_provider = 'heremaps'
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::IsolinesUsageMetrics.new(@user.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(@usage_metrics)
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @user.period_end_date = (DateTime.current + 1) << 1
      @user.save.reload
    end

    it "should return the sum of here isolines rows for the current billing period" do
      @usage_metrics.incr(:here_isolines, :isolines_generated, 10, DateTime.current)
      @usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 2))
      @user.get_here_isolines_calls.should eq 10
    end

    it "should return the sum of here isolines rows for the specified period" do
      @usage_metrics.incr(:here_isolines, :isolines_generated, 10, DateTime.current)
      @usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 2))
      @usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 7))
      @user.get_here_isolines_calls(from: Time.now-5.days).should eq 110
      @user.get_here_isolines_calls(from: Time.now-5.days, to: Time.now - 2.days).should eq 100
    end

    it "should return 0 when no here isolines actions" do
      @user.get_here_isolines_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe '#get_obs_snapshot_calls' do
    before do
      delete_user_data @user
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::ObservatorySnapshotUsageMetrics.new(@user.username, nil, @mock_redis)
      CartoDB::ObservatorySnapshotUsageMetrics.stubs(:new).returns(@usage_metrics)
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @user.period_end_date = (DateTime.current + 1) << 1
      @user.save.reload
    end

    it "should return the sum of data observatory snapshot rows for the current billing period" do
      @usage_metrics.incr(:obs_snapshot, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 2))
      @user.get_obs_snapshot_calls.should eq 10
    end

    it "should return the sum of data observatory snapshot rows for the specified period" do
      @usage_metrics.incr(:obs_snapshot, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 2))
      @usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 7))
      @user.get_obs_snapshot_calls(from: Time.now - 5.days).should eq 110
      @user.get_obs_snapshot_calls(from: Time.now - 5.days, to: Time.now - 2.days).should eq 100
    end

    it "should return 0 when no here isolines actions" do
      @user.get_obs_snapshot_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe '#get_obs_general_calls' do
    before do
      delete_user_data @user
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::ObservatoryGeneralUsageMetrics.new(@user.username, nil, @mock_redis)
      CartoDB::ObservatoryGeneralUsageMetrics.stubs(:new).returns(@usage_metrics)
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @user.period_end_date = (DateTime.current + 1) << 1
      @user.save.reload
    end

    it "should return the sum of data observatory general rows for the current billing period" do
      @usage_metrics.incr(:obs_general, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 2))
      @user.get_obs_general_calls.should eq 10
    end

    it "should return the sum of data observatory general rows for the specified period" do
      @usage_metrics.incr(:obs_general, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 2))
      @usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 7))
      @user.get_obs_general_calls(from: Time.now - 5.days).should eq 110
      @user.get_obs_general_calls(from: Time.now - 5.days, to: Time.now - 2.days).should eq 100
    end

    it "should return 0 when no data observatory general actions" do
      @user.get_obs_general_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe '#hard_geocoding_limit?' do
    it 'returns true when the plan is AMBASSADOR or FREE unless it has been manually set to false' do
      @user[:soft_geocoding_limit].should be_nil

      @user.stubs(:account_type).returns('AMBASSADOR')
      @user.soft_geocoding_limit?.should be_false
      @user.soft_geocoding_limit.should be_false
      @user.hard_geocoding_limit?.should be_true
      @user.hard_geocoding_limit.should be_true

      @user.stubs(:account_type).returns('FREE')
      @user.soft_geocoding_limit?.should be_false
      @user.soft_geocoding_limit.should be_false
      @user.hard_geocoding_limit?.should be_true
      @user.hard_geocoding_limit.should be_true

      @user.hard_geocoding_limit = false
      @user[:soft_geocoding_limit].should_not be_nil

      @user.stubs(:account_type).returns('AMBASSADOR')
      @user.soft_geocoding_limit?.should be_true
      @user.soft_geocoding_limit.should be_true
      @user.hard_geocoding_limit?.should be_false
      @user.hard_geocoding_limit.should be_false

      @user.stubs(:account_type).returns('FREE')
      @user.soft_geocoding_limit?.should be_true
      @user.soft_geocoding_limit.should be_true
      @user.hard_geocoding_limit?.should be_false
      @user.hard_geocoding_limit.should be_false
    end

    it 'returns true for enterprise accounts unless it has been manually set to false' do
      Carto::AccountType::ENTERPRISE_PLANS.each do |account_type|
        @user.stubs(:account_type).returns(account_type)

        @user.soft_geocoding_limit = nil

        @user.soft_geocoding_limit?.should be_false
        @user.soft_geocoding_limit.should be_false
        @user.hard_geocoding_limit?.should be_true
        @user.hard_geocoding_limit.should be_true

        @user.soft_geocoding_limit = true

        @user.soft_geocoding_limit?.should be_true
        @user.soft_geocoding_limit.should be_true
        @user.hard_geocoding_limit?.should be_false
        @user.hard_geocoding_limit.should be_false
      end
    end

    it 'returns false when the plan is MERCATOR unless it has been manually set to true' do
      @user.stubs(:account_type).returns('MERCATOR')
      @user.hard_geocoding_limit?.should be_false

      @user.hard_geocoding_limit = true

      @user.stubs(:account_type).returns('MERCATOR')
      @user.hard_geocoding_limit?.should be_true
    end
  end

  describe '#hard_here_isolines_limit?' do

    before(:each) do
      @user_account = create_user
    end

    it 'returns true with every plan unless it has been manually set to false' do
      @user_account[:soft_here_isolines_limit].should be_nil
      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_here_isolines_limit?.should be_false
      @user_account.soft_here_isolines_limit.should be_false
      @user_account.hard_here_isolines_limit?.should be_true
      @user_account.hard_here_isolines_limit.should be_true

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_here_isolines_limit?.should be_false
      @user_account.soft_here_isolines_limit.should be_false
      @user_account.hard_here_isolines_limit?.should be_true
      @user_account.hard_here_isolines_limit.should be_true

      @user_account.hard_here_isolines_limit = false
      @user_account[:soft_here_isolines_limit].should_not be_nil

      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_here_isolines_limit?.should be_true
      @user_account.soft_here_isolines_limit.should be_true
      @user_account.hard_here_isolines_limit?.should be_false
      @user_account.hard_here_isolines_limit.should be_false

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_here_isolines_limit?.should be_true
      @user_account.soft_here_isolines_limit.should be_true
      @user_account.hard_here_isolines_limit?.should be_false
      @user_account.hard_here_isolines_limit.should be_false
    end

  end

  describe '#hard_obs_snapshot_limit?' do

    before(:each) do
      @user_account = create_user
    end

    it 'returns true with every plan unless it has been manually set to false' do
      @user_account[:soft_obs_snapshot_limit].should be_nil
      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_snapshot_limit?.should be_false
      @user_account.soft_obs_snapshot_limit.should be_false
      @user_account.hard_obs_snapshot_limit?.should be_true
      @user_account.hard_obs_snapshot_limit.should be_true

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_snapshot_limit?.should be_false
      @user_account.soft_obs_snapshot_limit.should be_false
      @user_account.hard_obs_snapshot_limit?.should be_true
      @user_account.hard_obs_snapshot_limit.should be_true

      @user_account.hard_obs_snapshot_limit = false
      @user_account[:soft_obs_snapshot_limit].should_not be_nil

      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_snapshot_limit?.should be_true
      @user_account.soft_obs_snapshot_limit.should be_true
      @user_account.hard_obs_snapshot_limit?.should be_false
      @user_account.hard_obs_snapshot_limit.should be_false

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_snapshot_limit?.should be_true
      @user_account.soft_obs_snapshot_limit.should be_true
      @user_account.hard_obs_snapshot_limit?.should be_false
      @user_account.hard_obs_snapshot_limit.should be_false
    end

  end

  describe '#hard_obs_general_limit?' do

    before(:each) do
      @user_account = create_user
    end

    it 'returns true with every plan unless it has been manually set to false' do
      @user_account[:soft_obs_general_limit].should be_nil
      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_general_limit?.should be_false
      @user_account.soft_obs_general_limit.should be_false
      @user_account.hard_obs_general_limit?.should be_true
      @user_account.hard_obs_general_limit.should be_true

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_general_limit?.should be_false
      @user_account.soft_obs_general_limit.should be_false
      @user_account.hard_obs_general_limit?.should be_true
      @user_account.hard_obs_general_limit.should be_true

      @user_account.hard_obs_general_limit = false
      @user_account[:soft_obs_general_limit].should_not be_nil

      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_general_limit?.should be_true
      @user_account.soft_obs_general_limit.should be_true
      @user_account.hard_obs_general_limit?.should be_false
      @user_account.hard_obs_general_limit.should be_false

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_general_limit?.should be_true
      @user_account.soft_obs_general_limit.should be_true
      @user_account.hard_obs_general_limit?.should be_false
      @user_account.hard_obs_general_limit.should be_false
    end
  end
end