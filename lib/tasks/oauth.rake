require_relative '../../lib/static_maps_url_helper'

namespace :cartodb do
  namespace :oauth do
    desc 'Delete expired oauth access tokens'
    task destroy_expired_access_tokens: :environment do
      include ::LoggerHelper

      Carto::OauthAccessToken.expired.find_each do |token|
        begin
          token.destroy!
        rescue StandardError => e
          log_error(message: 'Could not destroy expired access token', exception: e)
        end
      end
    end

    desc 'Delete expired oauth authorization codes'
    task destroy_expired_authorization_codes: :environment do
      include ::LoggerHelper

      Carto::OauthAuthorizationCode.expired.find_each do |code|
        begin
          code.destroy!
        rescue StandardError => e
          log_error(message: 'Could not destroy expired authorization code', exception: e)
        end
      end
    end

    desc 'Delete expired oauth refresh tokens'
    task destroy_expired_refresh_tokens: :environment do
      include ::LoggerHelper

      Carto::OauthRefreshToken.expired.find_each do |code|
        begin
          code.destroy!
        rescue StandardError => e
          log_error(message: 'Could not destroy expired refresh token', exception: e)
        end
      end
    end

    desc 'Delete all expired oauth objects'
    task destroy_expired_oauth_keys: [
      :destroy_expired_access_tokens,
      :destroy_expired_refresh_tokens,
      :destroy_expired_authorization_codes
    ]

    # Since ownership_role creation is already handled in oauth_app_user
    # this task is meant to run just once for existing oauth_app_users in every cloud
    desc 'Create ownership roles for oauth_app_users missing it.'
    task create_ownership_role: :environment do
      include ::LoggerHelper

      Carto::OauthAppUser.find_each do |oau|
        begin
          next if oau.exists_ownership_role?

          oau.create_ownership_role
          oau.grant_ownership_role_privileges
        rescue StandardError => e
          log_error(message: 'Could not create ownership role', exception: e)
        end
      end
    end

    desc 'Track existing OauthApps and OauthAppUsers in Segment'
    task track_oauth_apps: :environment do
      include ::LoggerHelper

      Carto::OauthApp.find_each do |app|
        begin
          app_properties = {
            user_id: app.user_id,
            app_id: app.id,
            app_name: app.name,
            timestamp: app.created_at
          }
          Carto::Tracking::Events::CreatedOauthApp.new(app.user_id, app_properties).report

          app.oauth_app_users.find_each do |app_user|
            app_user_properties = {
              user_id: app_user.user_id,
              app_id: app.id,
              app_name: app.name,
              timestamp: app_user.created_at
            }
            Carto::Tracking::Events::CreatedOauthAppUser.new(app_user.user_id, app_user_properties).report
          end
        rescue StandardError => e
          log_error(message: 'Could not track event', exception: e)
        end
      end
    end
  end
end
