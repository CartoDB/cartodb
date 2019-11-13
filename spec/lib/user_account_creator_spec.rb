require_relative '../spec_helper'
require_relative '../../lib/user_account_creator'

describe CartoDB::UserAccountCreator do
  describe '#with_email_only' do
    USERNAME = "person"
    EMAIL = "#{USERNAME}@company.com"

    it 'sets email, username and (random) password' do
      creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_ORG_SIGNUP)
      creator.with_email_only(EMAIL)

      user = creator.build
      user.email.should == EMAIL
      user.username.should == USERNAME
      user.password.should_not be_empty

      user_creation = creator.build_user_creation
      user_creation.email.should == EMAIL
      user_creation.username.should == USERNAME
      user_creation.crypted_password.should_not be_empty
      user_creation.organization_id.should be_nil
    end
  end
end
