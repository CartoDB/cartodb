require_relative '../../spec_helper'

include CartoDB

describe CartoDB::PlatformLimits::Importer::UserConcurrentImportsAmount do

  before(:all) do
    @user = create_user( :quota_in_bytes => 524288000, :table_quota => 100 )
  end

  before(:each) do
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  describe '#importer-limits' do
    it 'checks concurrent imports rate limit' do
      old_concurrent_import_count = @user.max_concurrent_import_count

      new_limit_max = 2
      @user.update max_concurrent_import_count: new_limit_max

      # Set TTL threshold to 0 to ease calculations
      limit = CartoDB::PlatformLimits::Importer::UserConcurrentImportsAmount.new({
                                                                           user: @user,
                                                                           redis: {
                                                                             db: $users_metadata,
                                                                             expire_ttl_threshold_percent: 0
                                                                           }
                                                                         })


      limit.peek.should eq 0
      limit.is_over_limit?.should eq false
      limit.peek.should eq 0

      limit.maximum_limit?.should eq new_limit_max
      limit.remaining_limit?.should eq new_limit_max

      start_datetime = DateTime.now
      limit.is_over_limit!.should eq false
      end_datetime = limit.time_period?

      limit.peek.should eq 1

      limit.remaining_limit?.should eq new_limit_max-1

      limit.is_over_limit?.should eq false
      limit.is_over_limit!.should eq false
      limit.peek.should eq 2
      limit.is_over_limit!.should eq true
      limit.peek.should eq 3
      limit.is_over_limit?.should eq true
      limit.peek.should eq 3
      limit.decrement!
      limit.peek.should eq 2
      limit.is_over_limit?.should eq false

      ttl = end_datetime - start_datetime
      # We redis won't take more than 2 seconds on performing key creation + retrieval of TTL
      (ttl -  (@user.database_timeout/1000)).should be_within(2.0).of(0.0)

      limit.decrement!
      limit.decrement!
      limit.peek.should eq 0

      limit.is_within_limit!.should eq true
      limit.peek.should eq 1
      limit.is_within_limit?.should eq true
      limit.peek.should eq 1

      limit.is_within_limit!.should eq true
      limit.peek.should eq 2
      limit.is_within_limit!.should eq false
      limit.peek.should eq 3
      limit.is_within_limit?.should eq false
      limit.peek.should eq 3


      @user.update max_concurrent_import_count: old_concurrent_import_count
    end
  end

end
