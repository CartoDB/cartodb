require 'spec_helper'

describe Carto::AccessToken do

  let(:carto_user) { @user.carto_user }

  before(:all) do
    puts    "\n[rspec] Creating User for AccessToken spec..."
    @user = create_user
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  it "should store tokens in redis when it is created" do
    client_application = carto_user.client_application

    access_token = Carto::AccessToken.create(:user => carto_user, :client_application => client_application)
    access_token.present?

    base_key = "rails:oauth_access_tokens:#{access_token.token}"
    $api_credentials.hget(base_key, "consumer_key").should == client_application.key
    $api_credentials.hget(base_key, "consumer_secret").should == client_application.secret
    $api_credentials.hget(base_key, "access_token_token").should == access_token.token
    $api_credentials.hget(base_key, "access_token_secret").should == access_token.secret
    $api_credentials.hget(base_key, "user_id").should == carto_user.id.to_s
    $api_credentials.hget(base_key, "time").should == access_token.authorized_at.to_s
  end

  it "should remove tokens from redis when it is destroyed" do
    client_application = carto_user.client_application

    access_token = Carto::AccessToken.create(:user => carto_user, :client_application => client_application)
    access_token.present?

    base_key = "rails:oauth_access_tokens:#{access_token.token}"
    $api_credentials.keys.should include(base_key)
    access_token.destroy
    $api_credentials.keys.should_not include(base_key)
  end
end
