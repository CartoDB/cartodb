# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../user_shared_examples'

describe Carto::User do

  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).twitter_imports_count
    end

    def get_user_by_id(user_id)
      Carto::User.where(id: user_id).first
    end
  end

end
