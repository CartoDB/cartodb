# encoding: utf-8
require_relative './base_job'

module Resque
  module UserJobs
    module Mail
      
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

        def self.perform(visualization_id, user_id)
          v = CartoDB::Visualization::Member.new(id: visualization_id).fetch
          u = User.where(id: user_id).first
          UserMailer.unshare_visualization(v, u).deliver
        end
      end
      
      module UnshareTable
        @queue = :users

        def self.perform(table_id, user_id)
          t = CartoDB::Visualization::Member.new(id: table_id).fetch
          u = User.where(id: user_id).first
          UserMailer.unshare_table(t, u).deliver
        end
      end

    end
  end
end
