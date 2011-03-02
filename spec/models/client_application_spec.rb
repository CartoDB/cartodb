require File.dirname(__FILE__) + '/../spec_helper'
describe ClientApplication do
  fixtures :users, :client_applications, :oauth_tokens
  before(:each) do
    @application = ClientApplication.create :name => "Agree2", :url => "http://agree2.com", :user => users(:quentin)
  end

  it "should be valid" do
    @application.should be_valid
  end


  it "should not have errors" do
    @application.errors.full_messages.should == []
  end

  it "should have key and secret" do
    @application.key.should_not be_nil
    @application.secret.should_not be_nil
  end

  it "should have credentials" do
    @application.credentials.should_not be_nil
    @application.credentials.key.should == @application.key
    @application.credentials.secret.should == @application.secret
  end

end

