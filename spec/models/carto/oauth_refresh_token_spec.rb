require 'spec_helper_unit'

module Carto
  describe OauthRefreshToken do
    describe '#validation' do
      before do
        @carto_user = create(:carto_user, factory_bot_context: { only_db_setup: true })
        @user = @carto_user.sequel_user
        @app = create(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.new(user: @carto_user, oauth_app: @app)
      end

      it 'requires offline scope' do
        refresh_token = OauthRefreshToken.new
        expect(refresh_token).not_to(be_valid)
        expect(refresh_token.errors[:scopes]).to(include("must contain `offline`"))
      end

      it 'does not accept invalid scopes' do
        refresh_token = OauthRefreshToken.new(scopes: ['wadus'])
        expect(refresh_token).to_not(be_valid)
        expect(refresh_token.errors[:scopes]).to(include("contains unsupported scopes: wadus"))
      end

      it 'validates with offline scope' do
        refresh_token = OauthRefreshToken.new(oauth_app_user: @app_user, scopes: ['offline'])
        expect(refresh_token).to(be_valid)
      end
    end

    describe '#exchange!' do
      before do
        @carto_user = create(:carto_user, factory_bot_context: { only_db_setup: true })
        @user = @carto_user.sequel_user
        @app = create(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.create(user: @carto_user, oauth_app: @app)
        @refresh_token = @app_user.oauth_refresh_tokens.create!(scopes: ['offline'])
      end

      it 'fails if the token is expired' do
        @refresh_token.updated_at -= 1.year
        @refresh_token.save!

        expect { @refresh_token.exchange! }.to(raise_error(OauthProvider::Errors::InvalidGrant))
      end

      it 'can exchange multiple times while it has been used in the last 6 months' do
        @refresh_token.exchange!
        Delorean.jump(4.months)
        @refresh_token.exchange!
        Delorean.jump(4.months)
        @refresh_token.exchange!
        Delorean.jump(7.months)
        expect { @refresh_token.exchange! }.to(raise_error(OauthProvider::Errors::InvalidGrant))
      end

      it 'creates a new access token and regenerated the code and updated_at' do
        prev_token = @refresh_token.token
        prev_updated_at = @refresh_token.updated_at

        access_token, refresh_token = @refresh_token.exchange!

        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.scopes).to(eq(refresh_token.scopes))

        expect(refresh_token).to(eq(@refresh_token))
        expect(refresh_token.token).to_not(eq(prev_token))
        expect(refresh_token.updated_at).to_not(eq(prev_updated_at))
      end

      it 'creates a new access token with reduced scopes if asked to' do
        access_token, refresh_token = @refresh_token.exchange!(requested_scopes: [])

        expect(access_token.scopes).to(eq([]))
        expect(refresh_token.scopes).to(eq(['offline']))
      end

      it 'throws an error if requesting more scopes than available' do
        expect { @refresh_token.exchange!(requested_scopes: ['not_there']) }.to(
          raise_error(OauthProvider::Errors::InvalidScope)
        )
      end
    end

    describe '#create!' do
      before do
        @carto_user = create(:carto_user, factory_bot_context: { only_db_setup: true })
        @user = @carto_user.sequel_user
        @app = create(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.create(user: @carto_user, oauth_app: @app)
        OauthRefreshToken.send(:remove_const, 'MAX_TOKENS_PER_OAUTH_APP_USER')
        OauthRefreshToken::MAX_TOKENS_PER_OAUTH_APP_USER = 3
        create_tokens
      end

      def create_tokens
        Delorean.jump(1.month) do
          5.times do
            @app_user.oauth_refresh_tokens.create!(scopes: ['offline'])
          end
        end

        Delorean.back_to_the_present
        3.times do
          @app_user.oauth_refresh_tokens.create!(scopes: ['offline'])
        end
      end

      it 'keeps only most recent refresh tokens per OauthAppUser' do
        expect(
          OauthRefreshToken.where('oauth_app_user_id = ? and updated_at < ?', @app_user.id, Time.now - 1.month).count
        ).to(eq(0))
      end

      it 'keeps a maximum number of refresh tokens per OauthAppuser' do
        expect(
          OauthRefreshToken.where(oauth_app_user: @app_user).count
        ).to(eq(OauthRefreshToken::MAX_TOKENS_PER_OAUTH_APP_USER))
      end
    end
  end
end
