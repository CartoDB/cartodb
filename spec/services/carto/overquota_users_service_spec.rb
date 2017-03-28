require 'spec_helper_min'

describe 'Carto::OverquotaUsersService' do
  before(:all) do
    @user = FactoryGirl.create(:carto_user, account_type: 'NOT_FREE')
    @user2 = FactoryGirl.create(:carto_user, account_type: 'FREE')
  end

  after(:all) do
    @user.destroy
    @user2.destroy
  end

  # Filter overquota users to only those created by this spec
  def overquota(delta = 0)
    service = Carto::OverquotaUsersService.new
    $users_metadata.del(service.send(:date_key))
    service.store_overquota_users(delta)
    users = service.get_stored_overquota_users.map { |u| u['id'] }.select { |uid| [@user.id, @user2.id].include?(uid) }

    users
  end

  it "should return users near their geocoding quota" do
    ::User.any_instance.stubs(:get_api_calls).returns([0])
    ::User.any_instance.stubs(:map_view_quota).returns(120)
    ::User.any_instance.stubs(:get_geocoding_calls).returns(81)
    ::User.any_instance.stubs(:geocoding_quota).returns(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should return users near their here isolines quota" do
    ::User.any_instance.stubs(:get_api_calls).returns([0])
    ::User.any_instance.stubs(:map_view_quota).returns(120)
    ::User.any_instance.stubs(:get_geocoding_calls).returns(0)
    ::User.any_instance.stubs(:geocoding_quota).returns(100)
    ::User.any_instance.stubs(:get_here_isolines_calls).returns(81)
    ::User.any_instance.stubs(:here_isolines_quota).returns(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should return users near their data observatory snapshot quota" do
    ::User.any_instance.stubs(:get_api_calls).returns([0])
    ::User.any_instance.stubs(:map_view_quota).returns(120)
    ::User.any_instance.stubs(:get_geocoding_calls).returns(0)
    ::User.any_instance.stubs(:geocoding_quota).returns(100)
    ::User.any_instance.stubs(:get_here_isolines_calls).returns(0)
    ::User.any_instance.stubs(:here_isolines_quota).returns(100)
    ::User.any_instance.stubs(:get_obs_general_calls).returns(0)
    ::User.any_instance.stubs(:obs_general_quota).returns(100)
    ::User.any_instance.stubs(:get_obs_snapshot_calls).returns(81)
    ::User.any_instance.stubs(:obs_snapshot_quota).returns(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should return users near their data observatory general quota" do
    ::User.any_instance.stubs(:get_api_calls).returns([0])
    ::User.any_instance.stubs(:map_view_quota).returns(120)
    ::User.any_instance.stubs(:get_geocoding_calls).returns(0)
    ::User.any_instance.stubs(:geocoding_quota).returns(100)
    ::User.any_instance.stubs(:get_here_isolines_calls).returns(0)
    ::User.any_instance.stubs(:here_isolines_quota).returns(100)
    ::User.any_instance.stubs(:get_obs_snapshot_calls).returns(0)
    ::User.any_instance.stubs(:obs_snapshot_quota).returns(100)
    ::User.any_instance.stubs(:get_obs_general_calls).returns(81)
    ::User.any_instance.stubs(:obs_general_quota).returns(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end
  it "should return users near their twitter quota" do
    ::User.any_instance.stubs(:get_api_calls).returns([0])
    ::User.any_instance.stubs(:map_view_quota).returns(120)
    ::User.any_instance.stubs(:get_geocoding_calls).returns(0)
    ::User.any_instance.stubs(:geocoding_quota).returns(100)
    ::User.any_instance.stubs(:get_twitter_imports_count).returns(81)
    ::User.any_instance.stubs(:get_twitter_datasource_calls).returns(81)
    ::User.any_instance.stubs(:twitter_datasource_quota).returns(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should not return organization users" do
    ::User.any_instance.stubs(:organization_id).returns("organization-id")
    ::User.any_instance.stubs(:organization).returns(Organization.new)
    overquota.should be_empty
  end
end
