require_relative '../spec_helper'
require_relative 'user_shared_examples'
require 'helpers/user_part_helper'

describe 'refactored behaviour' do
  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).get_twitter_imports_count
    end

    def get_user_by_id(user_id)
      ::User.where(id: user_id).first
    end

    def create_user
      FactoryGirl.create(:valid_user)
    end

    def build_user
      FactoryGirl.build(:valid_user)
    end
  end
end
