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

    it "counts all users twitter imports" do
      # TODO: extract expectations
      User.any_instance.expects(:get_twitter_imports_count).never
      Carto::User.any_instance.expects(:twitter_imports_count).never

      create_search_tweet(@org_user_1, 5).save
      create_search_tweet(@org_user_1, 6).save

      # TODO: avoid this hidden parameter
      @organization_id = @organization.id
      get_twitter_imports_count_by_organization_id.should == 11
    end

  end

end

