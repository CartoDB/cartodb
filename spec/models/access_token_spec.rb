require 'spec_helper'

describe AccessToken do
  
  it "should store tokens in redis when it is created" do
    user = create_user
    client_application = user.client_application
    
    access_token = AccessToken.create(:user => user, :client_application => client_application)
    access_token.exists?
    
    base_key = "rails:oauth_access_tokens:#{access_token.token}"
    
    $api_credentials.hget(base_key, "consumer_key").should == client_application.key
    $api_credentials.hget(base_key, "access_token_token").should == access_token.token
    $api_credentials.hget(base_key, "access_token_secret").should == access_token.secret
    $api_credentials.hget(base_key, "user_id").should == user.id.to_s
    $api_credentials.hget(base_key, "time").should == access_token.authorized_at.to_s
  end
  
end