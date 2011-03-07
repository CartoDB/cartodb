require 'spec_helper'

describe APIKey do
  it "should not allow an empty domain" do
    user = create_user
    api_key = APIKey.new :user_id => user.id
    api_key.should_not be_valid
  end

  it "should add http protocol to db" do
    user = create_user
    api_key = APIKey.new :user_id => user.id, :domain => 'jamon.tumblr.com'
    api_key.save
    api_key.domain.should == 'http://jamon.tumblr.com'
  end

  it "should not allow the same domain" do
    user = create_user
    api_key = APIKey.new :user_id => user.id, :domain => 'jamon.tumblr.com'
    api_key.save
    api_key.domain.should == 'http://jamon.tumblr.com'

    api_key2 = APIKey.new :user_id => user.id, :domain => 'jamon.tumblr.com'
    lambda{
      api_key2.save
    }.should raise_error(Sequel::ValidationFailed)
    api_key2.should be_new
    api_key2.should_not be_valid
  end

end
