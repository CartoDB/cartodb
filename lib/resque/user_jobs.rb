require_relative './base_job'
require 'resque-metrics'
require_relative '../cartodb/metrics'

module Resque
  module OrganizationJobs
    module Mail
      module DiskQuotaLimitReached
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(organization_id)
          OrganizationMailer.quota_limit_reached(Carto::Organization.find(organization_id)).deliver_now
        end
      end

      module Invitation
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(invitation_id)
          invitation = Carto::Invitation.find(invitation_id)
          invitation.users_emails.each do |email|
            OrganizationMailer.invitation(invitation, email).deliver_now
          end
        end
      end

      module SeatLimitReached
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(organization_id)
          OrganizationMailer.seat_limit_reached(Carto::Organization.find(organization_id)).deliver_now
        end
      end
    end
  end

  module UserJobs
    module Signup
      module NewUser
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(user_creation_id, common_data_url = nil, organization_owner_promotion = false)
          user_creation = Carto::UserCreation.where(id: user_creation_id).first
          user_creation.set_common_data_url(common_data_url) unless common_data_url.nil?
          user_creation.set_owner_promotion(organization_owner_promotion)
          user_creation.next_creation_step! until user_creation.finished?
        end
      end
    end

    module NamedMapsLimitsJobs
      class CleanNamedMaps < BaseJob

        RETRY_TIME_SECONDS = 2
        MAX_RETRY_ATTEMPTS = 3

        @queue = :users

        def self.perform(options = {})
          run_action(options, @queue, lambda { |job_options|
            job_options.symbolize_keys[:urls].each { |url| delete(url, job_options.symbolize_keys[:request_params]) }
          })
        end

        def self.delete(url, request_params, retries: 0)
          http_client = Carto::Http::Client.get('named_maps')
          response = http_client.delete(url, request_params.symbolize_keys)

          response_code_string = response.code.to_s
          if response_code_string.start_with?('2')
            response.response_body
          elsif (response_code_string.start_with?('5') || response.code == 429) && retries < MAX_RETRY_ATTEMPTS
            sleep(RETRY_TIME_SECONDS**retries)
            delete(url, request_params, retries: retries + 1)
          end
        end

      end
    end

    module RateLimitsJobs
      module SyncRedis
        extend ::Resque::Metrics
        include Carto::Common::JobLogger
        extend ::LoggerHelper

        @queue = :batch_updates

        def self.perform(account_type)
          rate_limit = Carto::AccountType.find(account_type).rate_limit
          Carto::User.where(account_type: account_type, rate_limit_id: nil).find_each do |user|
            rate_limit.save_to_redis(user)
          end
        rescue StandardError => e
          log_error(exception: e, message: 'Error syncing rate limits to redis', account_type: account_type)
          raise e
        end
      end
    end

    module Notifications
      module Send
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(user_ids, notification_id)
          notification = Carto::Notification.find(notification_id)
          Carto::User.where(id: user_ids).find_each do |user|
            user.received_notifications.create!(notification: notification, received_at: DateTime.now)
          end
        end
      end
    end

    module Mail
      module NewOrganizationUser
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(user_id)
          u = ::User.where(id: user_id).first
          UserMailer.new_organization_user(u).deliver_now
        end
      end

      module ShareVisualization
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(visualization_id, user_id)
          v = Carto::Visualization.find(visualization_id)
          u = ::User.where(id: user_id).first
          UserMailer.share_visualization(v, u).deliver_now
        end
      end

      module ShareTable
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(table_id, user_id)
          t = Carto::Visualization.find(table_id)
          u = ::User.where(id: user_id).first
          UserMailer.share_table(t, u).deliver_now
        end
      end

      module UnshareVisualization
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(visualization_name, visualization_owner_name, user_id)
          u = ::User.where(id: user_id).first
          UserMailer.unshare_visualization(visualization_name, visualization_owner_name, u).deliver_now
        end
      end

      module UnshareTable
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(table_name, table_owner_name, user_id)
          u = ::User.where(id: user_id).first
          UserMailer.unshare_table(table_name, table_owner_name, u).deliver_now
        end
      end

      module MapLiked
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(visualization_id, viewer_user_id, vis_preview_image)
          viz = Carto::Visualization.find(visualization_id)
          viewer_user = Carto::User.find(viewer_user_id)
          UserMailer.map_liked(viz, viewer_user, vis_preview_image).deliver_now
        end
      end

      module TableLiked
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(visualization_id, viewer_user_id, vis_preview_image)
          viz = Carto::Visualization.find(visualization_id)
          viewer_user = Carto::User.find(viewer_user_id)
          UserMailer.table_liked(viz, viewer_user, vis_preview_image).deliver_now
        end
      end

      module DataImportFinished
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(user_id, imported_tables, total_tables, first_imported_table, first_table, errors, filenames)
          u = ::User.where(id: user_id).first
          return unless u.carto_user.email_notification_enabled?(Carto::UserEmailNotification::NOTIFICATION_IMPORTS)

          ImportMailer.data_import_finished(u, imported_tables, total_tables, first_imported_table, first_table, errors,
                                            filenames).deliver_now
        end
      end

      module GeocoderFinished
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(user_id, state, table_name, error_code, processable_rows, number_geocoded_rows)
          user = ::User.where(id: user_id).first
          GeocoderMailer.geocoding_finished(user, state, table_name, error_code, processable_rows, number_geocoded_rows)
                        .deliver_now
        end
      end

      module Sync
        module MaxRetriesReached
          extend ::Resque::Metrics
          include Carto::Common::JobLogger

          @queue = :users

          def self.perform(user_id, visualization_id, dataset_name, error_code, error_message)
            user = ::User.where(id: user_id).first
            SyncMailer.max_retries_reached(user, visualization_id, dataset_name, error_code, error_message).deliver_now
          end
        end
      end

      module TrendingMap
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(visualization_id, mapviews, vis_preview_image)
          visualization = Carto::Visualization.find(visualization_id)
          UserMailer.trending_map(visualization, mapviews, vis_preview_image).deliver_now
        end
      end

      module PasswordReset
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :users

        def self.perform(user_id)
          user = Carto::User.find(user_id)
          UserMailer.password_reset(user).deliver_now
        end
      end
    end
  end
end
