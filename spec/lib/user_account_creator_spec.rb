# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../lib/user_account_creator'

describe CartoDB::UserAccountCreator do
  describe '#with_email_only' do
    USERNAME = "person"
    EMAIL = "#{USERNAME}@company.com"

    it 'sets email, username and (random) password' do
      creator = CartoDB::UserAccountCreator.new
      creator.with_email_only(EMAIL)

      user = creator.build
      user.email.should == EMAIL
      user.username.should == USERNAME
      user.password.should_not be_empty
    end
  end
end
