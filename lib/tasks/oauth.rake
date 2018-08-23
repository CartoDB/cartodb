require_relative '../../lib/cartodb/trending_maps'
require_relative '../../lib/static_maps_url_helper'

namespace :cartodb do
  namespace :oauth do
    desc 'Delete expired oauth access tokens'
    task destroy_expired_access_tokens: :environment do
      Carto::OauthAccessToken.expired.find_each do |token|
        begin
          token.destroy!
        rescue StandardError => e
          CartoDB::Logger.error(message: 'Could not destroy expired access token', exception: e)
        end
      end
    end

    desc 'Delete expired oauth authorization codes'
    task destroy_expired_authorization_codes: :environment do
      Carto::OauthAuthorizationCode.expired.find_each do |code|
        begin
          code.destroy!
        rescue StandardError => e
          CartoDB::Logger.error(message: 'Could not destroy expired authorization code', exception: e)
        end
      end
    end

    desc 'Delete expired oauth refresh tokens'
    task destroy_expired_refresh_tokens: :environment do
      Carto::OauthRefreshToken.expired.find_each do |code|
        begin
          code.destroy!
        rescue StandardError => e
          CartoDB::Logger.error(message: 'Could not destroy expired refresh token', exception: e)
        end
      end
    end

    desc 'Delete all expired oauth objects'
    task destroy_expired_oauth_keys: [
      :destroy_expired_access_tokens,
      :destroy_expired_refresh_tokens,
      :destroy_expired_authorization_codes
    ]
  end
end
