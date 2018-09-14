require 'spec_helper_min'
require 'rake'

describe 'oauth.rake' do
  before(:all) do
    Rake.application.rake_require('tasks/oauth')
    Rake::Task.define_task(:environment)

    @sequel_developer = FactoryGirl.create(:valid_user)
    @developer = Carto::User.find(@sequel_developer.id)
    @user = FactoryGirl.create(:valid_user)
    @oauth_app = FactoryGirl.create(:oauth_app, user: @developer)
  end

  before(:each) do
    @oauth_app_user = @oauth_app.oauth_app_users.create!(user_id: @user.id)
  end

  after(:each) do
    @oauth_app_user.reload.destroy!
    Delorean.back_to_the_present
  end

  after(:all) do
    @oauth_app.destroy!
    @user.destroy
    @sequel_developer.destroy
  end

  describe '#destroy_expired_access_tokens' do
    before(:each) do
      Rake::Task['cartodb:oauth:destroy_expired_access_tokens'].reenable
    end

    it 'does not delete just created access tokens' do
      access_token = @oauth_app_user.oauth_access_tokens.create!
      Rake::Task['cartodb:oauth:destroy_expired_access_tokens'].invoke
      expect(Carto::OauthAccessToken.exists?(access_token.id)).to(be_true)
    end

    it 'deletes old access tokens' do
      access_token = @oauth_app_user.oauth_access_tokens.create!
      Delorean.jump(2.hours)
      Rake::Task['cartodb:oauth:destroy_expired_access_tokens'].invoke
      expect(Carto::OauthAccessToken.exists?(access_token.id)).to(be_false)
    end
  end

  describe '#destroy_expired_refresh_tokens' do
    before(:each) do
      Rake::Task['cartodb:oauth:destroy_expired_refresh_tokens'].reenable
    end

    it 'does not delete just created access tokens' do
      refresh_token = @oauth_app_user.oauth_refresh_tokens.create!(scopes: ['offline'])
      Rake::Task['cartodb:oauth:destroy_expired_refresh_tokens'].invoke
      expect(Carto::OauthRefreshToken.exists?(refresh_token.id)).to(be_true)
    end

    it 'deletes old access tokens' do
      refresh_token = @oauth_app_user.oauth_refresh_tokens.create!(scopes: ['offline'])
      Delorean.jump(1.year)
      Rake::Task['cartodb:oauth:destroy_expired_refresh_tokens'].invoke
      expect(Carto::OauthRefreshToken.exists?(refresh_token.id)).to(be_false)
    end
  end

  describe '#destroy_expired_authorization_codes' do
    before(:each) do
      Rake::Task['cartodb:oauth:destroy_expired_authorization_codes'].reenable
    end

    it 'does not delete just created access tokens' do
      authorization_code = @oauth_app_user.oauth_authorization_codes.create!
      Rake::Task['cartodb:oauth:destroy_expired_authorization_codes'].invoke
      expect(Carto::OauthAuthorizationCode.exists?(authorization_code.id)).to(be_true)
    end

    it 'deletes old access tokens' do
      authorization_code = @oauth_app_user.oauth_authorization_codes.create!
      Delorean.jump(2.minutes)
      Rake::Task['cartodb:oauth:destroy_expired_authorization_codes'].invoke
      expect(Carto::OauthAuthorizationCode.exists?(authorization_code.id)).to(be_false)
    end
  end
end
