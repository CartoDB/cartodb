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
    allow_any_instance_of(::User).to receive(:get_api_calls).and_return([0])
    allow_any_instance_of(::User).to receive(:map_view_quota).and_return(120)
    allow_any_instance_of(::User).to receive(:get_geocoding_calls).and_return(81)
    allow_any_instance_of(::User).to receive(:geocoding_quota).and_return(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should return users near their here isolines quota" do
    allow_any_instance_of(::User).to receive(:get_api_calls).and_return([0])
    allow_any_instance_of(::User).to receive(:map_view_quota).and_return(120)
    allow_any_instance_of(::User).to receive(:get_geocoding_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:geocoding_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_here_isolines_calls).and_return(81)
    allow_any_instance_of(::User).to receive(:here_isolines_quota).and_return(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should return users near their data observatory snapshot quota" do
    allow_any_instance_of(::User).to receive(:get_api_calls).and_return([0])
    allow_any_instance_of(::User).to receive(:map_view_quota).and_return(120)
    allow_any_instance_of(::User).to receive(:get_geocoding_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:geocoding_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_here_isolines_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:here_isolines_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_obs_general_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:obs_general_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_obs_snapshot_calls).and_return(81)
    allow_any_instance_of(::User).to receive(:obs_snapshot_quota).and_return(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should return users near their data observatory general quota" do
    allow_any_instance_of(::User).to receive(:get_api_calls).and_return([0])
    allow_any_instance_of(::User).to receive(:map_view_quota).and_return(120)
    allow_any_instance_of(::User).to receive(:get_geocoding_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:geocoding_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_here_isolines_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:here_isolines_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_obs_snapshot_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:obs_snapshot_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_obs_general_calls).and_return(81)
    allow_any_instance_of(::User).to receive(:obs_general_quota).and_return(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end
  it "should return users near their twitter quota" do
    allow_any_instance_of(::User).to receive(:get_api_calls).and_return([0])
    allow_any_instance_of(::User).to receive(:map_view_quota).and_return(120)
    allow_any_instance_of(::User).to receive(:get_geocoding_calls).and_return(0)
    allow_any_instance_of(::User).to receive(:geocoding_quota).and_return(100)
    allow_any_instance_of(::User).to receive(:get_twitter_imports_count).and_return(81)
    allow_any_instance_of(::User).to receive(:get_twitter_datasource_calls).and_return(81)
    allow_any_instance_of(::User).to receive(:twitter_datasource_quota).and_return(100)
    overquota.should be_empty
    overquota(0.20).should include(@user.id, @user2.id)
    overquota(0.20).size.should == 2
    overquota(0.10).should be_empty
  end

  it "should not return organization users" do
    allow_any_instance_of(::User).to receive(:organization_id).and_return("organization-id")
    allow_any_instance_of(::User).to receive(:organization).and_return(Carto::Organization.new)
    overquota.should be_empty
  end
end
