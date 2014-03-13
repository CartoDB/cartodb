# encoding: utf-8
require 'sequel'
require_relative '../../../services/data-repository/backend/sequel'

# encoding: utf-8
module CartoDB
  module Visualization
    class Migrator
      def initialize(db)
        @db = db
      end #initialize

      def migrate(relation=:visualizations)
        @db.create_table(relation.to_sym) do
          String    :id, primary_key: true
          String    :name
          String    :description
          String    :map_id, index: true
          String   :active_layer_id
          String    :type
          String    :privacy
          DateTime  :created_at, null: false
          DateTime  :updated_at, null: false
          String    :encrypted_password
          String    :password_salt
        end

        @db.run(%Q{
          ALTER TABLE "#{relation}"
          ADD COLUMN tags text[]
        })
      end #migrate

      def drop(relation=:visualizations)
        @db.drop_table(relation.to_sym)
      end #drop
    end # Migrator
  end # Visualization
end # CartoDB

