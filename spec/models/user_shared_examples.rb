# encoding: UTF-8

require_relative '../spec_helper'

# Tests should define the following method:
# - `get_twitter_imports_count_by_user_id`
# - `get_user_by_id`
shared_examples_for "user models" do

  describe '#get_twitter_imports_count' do

    include_context 'users helper'

    it "should count tweet imports" do
      FactoryGirl.create(:search_tweet, user: @user1, retrieved_items: 5)

      FactoryGirl.create(:search_tweet, user: @user2, retrieved_items: 6)

      get_twitter_imports_count_by_user_id(@user1.id).should == 5
    end

  end

  describe 'twitter_datasource_enabled for org users' do
    include_context 'organization with users helper'

    it 'is enabled if organization has it enabled, no matter whether user has it or not, and enabled if he has it enabled, no matter whether org has it or not' do
      @organization.twitter_datasource_enabled = false
      @organization.save.reload

      @org_user_1.twitter_datasource_enabled = false
      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == false

      @organization.twitter_datasource_enabled = true
      @organization.save.reload

      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == true

      @org_user_1.twitter_datasource_enabled = true
      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == true

      @organization.twitter_datasource_enabled = false
      @organization.save.reload

      @org_user_1.twitter_datasource_enabled = true
      @org_user_1.save.reload
      get_user_by_id(@org_user_1.id).twitter_datasource_enabled.should == true
    end

  end

  describe 'User#remaining_geocoding_quota' do

    include_context 'users helper'
    include_context 'organization with users helper'

    it 'calculates the remaining quota for a non-org user correctly' do
      @user1.geocoding_quota = 500
      @user1.save
      Geocoding.new({
          kind: 'high-resolution',
          user: @user1,
          formatter: '{dummy}',
          processed_rows: 100
        }).save

      get_user_by_id(@user1.id).remaining_geocoding_quota.should == 400
    end


    it 'takes into account geocodings performed by the org users #4033' do
      @organization.geocoding_quota = 500
      @organization.save.reload

      Geocoding.new({
          kind: 'high-resolution',
          user: @org_user_1,
          formatter: '{dummy}',
          processed_rows: 100
        }).save

      Geocoding.new({
          kind: 'high-resolution',
          user: @org_user_2,
          formatter: '{dummy}',
          processed_rows: 100
        }).save

      get_user_by_id(@org_user_1.id).remaining_geocoding_quota.should == 300
      get_user_by_id(@org_user_2.id).remaining_geocoding_quota.should == 300
    end

  end

end
