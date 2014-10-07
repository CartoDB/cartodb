# encoding: utf-8
require_relative './base_job'

module Resque
  module UserJobs
    module Mail

      module NewOrganizationUser
        @queue = :users

        def self.perform(user_id)
          u = User.where(id: user_id).first
          UserMailer.new_organization_user(u).deliver
        end
      end

      module ShareVisualization
        @queue = :users

        def self.perform(visualization_id, user_id)
          v = CartoDB::Visualization::Member.new(id: visualization_id).fetch
          u = User.where(id: user_id).first
          UserMailer.share_visualization(v, u).deliver
        end
      end
      
      module ShareTable
        @queue = :users

        def self.perform(table_id, user_id)
          t = CartoDB::Visualization::Member.new(id: table_id).fetch
          u = User.where(id: user_id).first
          UserMailer.share_table(t, u).deliver
        end
      end
    
      module UnshareVisualization
        @queue = :users

        def self.perform(visualization_name, visualization_owner_name, user_id)
          #v = CartoDB::Visualization::Member.new(id: visualization_id).fetch
          u = User.where(id: user_id).first
          UserMailer.unshare_visualization(visualization_name, visualization_owner_name, u).deliver
        end
      end
      
      module UnshareTable
        @queue = :users

        def self.perform(table_name, table_owner_name, user_id)
          #t = CartoDB::Visualization::Member.new(id: table_id).fetch
          u = User.where(id: user_id).first
          UserMailer.unshare_table(table_name, table_owner_name, u).deliver
        end
      end

      module DataImportFinished
        @queue = :users

        def self.perform(user_id, imported_tables, total_tables, first_table)
          user = User.where(id: user_id).first
          UserMailer.data_import_finished(user, imported_tables, total_tables, first_table).deliver
        end
      end

    end
  end
end
