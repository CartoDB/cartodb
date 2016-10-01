# encoding: utf-8
require_relative './base_job'
require 'resque-metrics'
require_relative '../cartodb/metrics'

module Resque
  module UserDBJobs
    module UserDBMaintenance
      module LinkGhostTables
        extend ::Resque::Metrics
        @queue = :user_dbs

        def self.perform(user_id)
          Carto::GhostTablesManager.new(user_id).link_ghost_tables_synchronously
        rescue => e
          CartoDB.notify_exception(e)
          raise e
        end
      end

      module AutoIndexTable
        @queue = :user_dbs

        def self.perform(user_table_id)
          user_table = Carto::UserTable.where(id: user_table_id).first
          Carto::UserTableIndexService.new(user_table).update_auto_indices if user_table
        rescue => e
          CartoDB::Logger.error(message: 'Error auto-indexing table', exception: e, user_table_id: user_table_id)
        end
      end
    end

    module CommonData
      module LoadCommonData
        @queue = :user_dbs

        def self.perform(user_id, visualizations_api_url)
          user = ::User.where(id: user_id).first
          user.load_common_data(visualizations_api_url) if user.should_load_common_data?
        end
      end
    end
  end
end
