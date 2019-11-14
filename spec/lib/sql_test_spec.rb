require 'spec_helper'

describe User do
  before(:all) do
    @user = create_user :email => 'admin@example.com', :username => 'admin', :password => 'admin123'
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
  end

  it "should pass all the sql tests" do
    @user.should pass_sql_tests
  end
end
