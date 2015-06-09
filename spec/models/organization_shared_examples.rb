# encoding: UTF-8

require_relative '../spec_helper'

# Tests should define `get_twitter_imports_count_by_organization_id` method
shared_examples_for "organization models" do

  describe "#get_twitter_imports_count" do
    include_context 'organization with users helper'

    def create_search_tweet(user, retrieved_items)
      st = SearchTweet.new

      st.user = user
      st.table_id = '96a86fb7-0270-4255-a327-15410c2d49d4'
      st.data_import_id = '96a86fb7-0270-4255-a327-15410c2d49d4'
      st.service_item_id = '555'
      st.retrieved_items = retrieved_items
      st.state = ::SearchTweet::STATE_COMPLETE

      st
    end

    it "counts all users twitter imports in a single query" do
      create_search_tweet(@org_user_1, 5).save
      create_search_tweet(@org_user_1, 6).save

      expect {
        get_twitter_imports_count_by_organization_id(@organization.id).should == 11
      }.to make_database_queries(count: 1)
    end

  end

end

