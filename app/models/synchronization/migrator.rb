# encoding: utf-8
require 'sequel'
require_relative '../../../services/data-repository/backend/sequel'

# encoding: utf-8
module CartoDB
  module Synchronization
    class Migrator
      def initialize(db)
        @db = db
      end #initialize

      def migrate(relation=:synchronizations)
        @db.create_table(relation.to_sym) do
          String    :id, primary_key: true
          String    :name
          Integer   :interval
          String    :url
          String    :state
          Integer   :user_id
          DateTime  :created_at, null: false
          DateTime  :updated_at, null: false
          DateTime  :run_at
          DateTime  :runned_at
          Integer   :retried_times
        end

        @db.run(%Q{
          ALTER TABLE #{relation}
          ADD COLUMN tags text[]
        })
      end #migrate

      def drop(relation=:synchronizations)
        @db.drop_table(relation.to_sym)
      end #drop
    end # Migrator
  end # Synchronization
end # CartoDB

