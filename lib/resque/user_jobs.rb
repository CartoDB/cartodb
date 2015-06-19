# encoding: utf-8
require_relative './base_job'
require 'resque-metrics'

module Resque
  module UserJobs

    module Signup

      module NewUser
        @queue = :users

        def self.perform(user_creation_id)
          user_creation = Carto::UserCreation.where(id: user_creation_id).first
          user_creation.next_creation_step! until user_creation.finished?
        end

      end

    end

    module SyncTables

      module LinkGhostTables 
        extend ::Resque::Metrics
        @queue = :users

        def self.perform(user_id)
          u = User.where(id: user_id).first
          u.link_ghost_tables
        end

      end

    end


    module CommonData
      module LoadCommonData
        @queue = :users

        def self.perform(user_id)
          User.where(id: user_id).first.load_common_data
        end
      end

    end


    module Mail

      module NewOrganizationUser
        extend ::Resque::Metrics
        @queue = :users

        def self.perform(user_id)
          u = User.where(id: user_id).first
          UserMailer.new_organization_user(u).deliver
        end
      end

      module ShareVisualization
        extend ::Resque::Metrics
        @queue = :users

        def self.perform(visualization_id, user_id)
          v = CartoDB::Visualization::Member.new(id: visualization_id).fetch
          u = User.where(id: user_id).first
          UserMailer.share_visualization(v, u).deliver
        end
      end
      
      module ShareTable
        extend ::Resque::Metrics
        @queue = :users

        def self.perform(table_id, user_id)
          t = CartoDB::Visualization::Member.new(id: table_id).fetch
          u = User.where(id: user_id).first
          UserMailer.share_table(t, u).deliver
        end
      end
    
      module UnshareVisualization
        extend ::Resque::Metrics
        @queue = :users

        def self.perform(visualization_name, visualization_owner_name, user_id)
          #v = CartoDB::Visualization::Member.new(id: visualization_id).fetch
          u = User.where(id: user_id).first
          UserMailer.unshare_visualization(visualization_name, visualization_owner_name, u).deliver
        end
      end
      
      module UnshareTable
        extend ::Resque::Metrics
        @queue = :users

        def self.perform(table_name, table_owner_name, user_id)
          #t = CartoDB::Visualization::Member.new(id: table_id).fetch
          u = User.where(id: user_id).first
          UserMailer.unshare_table(table_name, table_owner_name, u).deliver
        end
      end

      module DataImportFinished
        extend ::Resque::Metrics
        @queue = :users

        def self.perform(user_id, imported_tables, total_tables, first_imported_table, first_table, errors)
          u = User.where(id: user_id).first
          ImportMailer.data_import_finished(u, imported_tables, total_tables, first_imported_table, first_table, errors).deliver
        end
      end

    end
  end
end
