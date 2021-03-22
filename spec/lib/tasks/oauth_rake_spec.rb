require 'spec_helper_unit'

describe 'oauth.rake' do
  before do
    Rake.application.rake_require('tasks/oauth')
    Rake::Task.define_task(:environment)
    @sequel_developer = create(:valid_user)
    @developer = Carto::User.find(@sequel_developer.id)
    @user = create(:valid_user)
    @oauth_app = create(:oauth_app, user: @developer)
    @oauth_app_user = @oauth_app.oauth_app_users.create!(user_id: @user.id)
  end

  describe '#destroy_expired_access_tokens' do
    after do
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
    after do
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
    after do
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

  describe '#create_ownership_role' do
    after do
      Rake::Task['cartodb:oauth:create_ownership_role'].reenable
    end

    it 'does nothing for a user with ownership role' do
      expect(@oauth_app_user.exists_ownership_role?).to(be_true)
      Carto::OauthAppUser.any_instance.expects(:create_ownership_role).never
      Carto::OauthAppUser.any_instance.expects(:grant_ownership_role_privileges).never
      Carto::ApiKey.any_instance.expects(:grant_ownership_role_privileges).never
      Carto::ApiKey.any_instance.expects(:save_cdb_conf_info).never
      Rake::Task['cartodb:oauth:create_ownership_role'].invoke
    end

    it 'creates ownership roles + grants for oauth app users missing it' do
      drop_role_query = %{ DROP ROLE "#{@oauth_app_user.ownership_role_name}" }
      @developer.in_database(as: :superuser).execute(drop_role_query)
      expect(@oauth_app_user.exists_ownership_role?).to(be_false)

      Carto::OauthAppUser.any_instance.expects(:grant_ownership_role_privileges).once
      Rake::Task['cartodb:oauth:create_ownership_role'].invoke

      expect(@oauth_app_user.exists_ownership_role?).to(be_true)
    end
  end
end
