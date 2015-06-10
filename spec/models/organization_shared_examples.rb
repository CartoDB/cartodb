# encoding: UTF-8

require_relative '../spec_helper'

# Tests should define `get_twitter_imports_count_by_organization_id` method
shared_examples_for "organization models" do

  describe "#get_twitter_imports_count" do
    include_context 'users helper'
    include_context 'organization with users helper'

    it "counts all users twitter imports in a single query" do
      FactoryGirl.create(:search_tweet, user: @org_user_1, retrieved_items: 5)
      FactoryGirl.create(:search_tweet, user: @org_user_2, retrieved_items: 6)

      FactoryGirl.create(:search_tweet, user: @user1, retrieved_items: 5)

      expect {
        get_twitter_imports_count_by_organization_id(@organization.id).should == 11
      }.to make_database_queries(count: 1)
    end

  end

end

