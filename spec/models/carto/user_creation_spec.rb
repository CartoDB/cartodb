require_relative '../../spec_helper'
require_relative '../../../app/models/carto/user_creation'

describe Carto::UserCreation do

  describe 'validation token' do
    include_context 'organization with users helper'

    it 'assigns an enable_account_token if user has not signed up with Google' do
      user_data = FactoryGirl.build(:valid_user)
      user_data.google_sign_in = false
      user_data.organization = @organization

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.order("created_at desc").limit(1).first
      saved_user.enable_account_token.should_not be_nil
    end

    it 'does not assign an enable_account_token if user has signed up with Google' do
      user_data = FactoryGirl.build(:valid_user)
      user_data.google_sign_in = true
      user_data.organization = @organization

      user_creation = Carto::UserCreation.new_user_signup(user_data)
      user_creation.next_creation_step until user_creation.finished?

      saved_user = Carto::User.order("created_at desc").limit(1).first
      saved_user.enable_account_token.should be_nil
    end

  end

end
