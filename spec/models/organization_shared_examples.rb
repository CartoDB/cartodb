# encoding: UTF-8

require_relative '../spec_helper'

# Tests should define the following methods:
# - get_organization: returns a correspoding Organization instance
# - get_twitter_imports_count_by_organization_id: returns organization import count. Needed because implementations don't share a common interface
shared_examples_for "organization models" do
  include_context 'users helper'
  include_context 'organization with users helper'

  describe "#get_geocoding_calls" do

    it "counts all geocodings in a single query" do
      FactoryGirl.create(:high_resolution_geocoding, user: @org_user_1, formatter: 'admin0', processed_rows: 2, cache_hits: 3)
      FactoryGirl.create(:high_resolution_geocoding, user: @org_user_2, formatter: 'admin0', processed_rows: 4, cache_hits: 5)
      FactoryGirl.create(:high_resolution_geocoding, user: @user1, formatter: 'admin0', processed_rows: 2, cache_hits: 3)

      expect {
        ::User.any_instance.expects(:get_geocoding_calls).never
        get_geocoding_calls_by_organization_id(@organization.id).should == 14
      }.to make_database_queries(count: 0..5)
    end

  end

  describe "#get_twitter_imports_count" do

    it "counts all users twitter imports in a single query" do
      FactoryGirl.create(:search_tweet, user: @org_user_1, retrieved_items: 5)
      FactoryGirl.create(:search_tweet, user: @org_user_2, retrieved_items: 6)

      FactoryGirl.create(:search_tweet, user: @user1, retrieved_items: 5)

      # TODO: range and model expectation is needed because Sequel model is not counting sql queries, and can't know why.
      ::User.any_instance.expects(:get_twitter_imports_count).never
      expect {
        get_twitter_imports_count_by_organization_id(@organization.id).should == 11
      }.to make_database_queries(count: 0..1)
    end

  end

  describe "#signup_page_enabled" do
    it 'is true if domain whitelist is not empty' do
      organization = get_organization
      organization.auth_username_password_enabled = true
      organization.whitelisted_email_domains = ['carto.com']
      organization.signup_page_enabled.should == true
    end

    it 'is false if domain whitelist is empty' do
      organization = get_organization
      organization.auth_username_password_enabled = true
      organization.whitelisted_email_domains = []
      organization.signup_page_enabled.should == false
    end

    it 'is false if no authentication is enabled' do
      organization = get_organization
      organization.auth_username_password_enabled = false
      organization.auth_google_enabled = false
      organization.auth_github_enabled = false
      organization.whitelisted_email_domains = ['carto.com']
      organization.signup_page_enabled.should be_false
    end
  end

  it 'generates auth_tokens and save them for future accesses' do
    token = get_organization.get_auth_token
    token.should be
    get_organization.reload
    get_organization.get_auth_token.should eq token
  end
end
