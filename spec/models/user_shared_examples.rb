# encoding: UTF-8

require_relative '../spec_helper'

# Tests should define `get_twitter_imports_count_by_user_id` method
shared_examples_for "user models" do

  describe '#get_twitter_imports_count' do
    include_context 'users helper'

    it "should count tweet imports" do
      st = SearchTweet.new
      st.user = @user1
      st.table_id = '96a86fb7-0270-4255-a327-15410c2d49d4'
      st.data_import_id = '96a86fb7-0270-4255-a327-15410c2d49d4'
      st.service_item_id = '555'
      st.retrieved_items = 5
      st.state = ::SearchTweet::STATE_COMPLETE
      st.save

      get_twitter_imports_count_by_user_id(@user1.id).should == 5
    end

  end

end
