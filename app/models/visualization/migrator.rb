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

      def migrate
        @db.create_table :visualizations do
          String    :id, primary_key: true
          String    :name
          String    :description
          Integer   :map_id, index: true
          Integer   :active_layer_id
          String    :type
        end

        @db.run(%Q{
          ALTER TABLE "visualizations"
          ADD COLUMN tags text[]
        })
      end #migrate
    end # Migrator
  end # Visualization
end # CartoDB

