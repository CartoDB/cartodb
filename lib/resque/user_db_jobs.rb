require_relative './base_job'
require 'resque-metrics'
require_relative '../cartodb/metrics'

module Resque
  module UserDBJobs
    module UserDBMaintenance
      module LinkGhostTables
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :user_dbs

        def self.perform(user_id)
          Carto::GhostTablesManager.new(user_id).link_ghost_tables_synchronously
        rescue StandardError => e
          CartoDB.notify_exception(e)
          raise e
        end
      end

      module LinkGhostTablesByUsername
        extend ::Resque::Metrics
        include Carto::Common::JobLogger

        @queue = :user_dbs

        def self.perform(username)
          user = Carto::User.find_by_username!(username)
          Carto::GhostTablesManager.new(user.id).link_ghost_tables_synchronously
        rescue StandardError => e
          CartoDB.notify_exception(e)
          raise e
        end
      end

      module AutoIndexTable
        include Carto::Common::JobLogger
        extend ::LoggerHelper

        @queue = :user_dbs

        def self.perform(user_table_id)
          user_table = Carto::UserTable.find(user_table_id)
          Carto::UserTableIndexService.new(user_table).update_auto_indices if user_table
        rescue StandardError => e
          log_error(message: 'Error auto-indexing table', exception: e, table: user_table.attributes.slice(:id))
        end
      end
    end

    module CommonData
      module LoadCommonData
        include Carto::Common::JobLogger

        @queue = :user_dbs

        def self.perform(user_id, visualizations_api_url)
          user = ::User.where(id: user_id).first
          return unless user.should_load_common_data?

          bolt = Carto::Bolt.new("user_common_data:#{user.id}:auto_index")
          bolt.run_locked { user.load_common_data(visualizations_api_url) }
        end
      end
    end
  end
end
