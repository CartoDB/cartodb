require File.dirname(__FILE__) + '/../spec_helper'

describe Oauth2Token do
  fixtures :client_applications, :users, :oauth_tokens
  before(:each) do
    @token = Oauth2Token.create :client_application => client_applications(:one), :user=>users(:aaron)
  end

  it "should be valid" do
    @token.should be_valid
  end

  it "should have a token" do
    @token.token.should_not be_nil
  end

  it "should have a secret" do
    @token.secret.should_not be_nil
  end

  it "should be authorized" do
    @token.should be_authorized
  end

  it "should not be invalidated" do
    @token.should_not be_invalidated
  end

end
