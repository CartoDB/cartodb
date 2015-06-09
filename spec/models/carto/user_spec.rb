# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../user_shared_examples'

describe Carto::User do

  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      Carto::User.where(id: user_id).first.twitter_imports_count
    end
  end

end
