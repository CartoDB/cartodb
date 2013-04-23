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
          String    :map_id
          String    :type
          String    :tags
        end

        @db.create_table :overlays do
          String    :id,                null: false, primary_key: true
          Integer   :order,             null: false
          String    :options,           text: true
          String    :type
          String    :visualization_id,  index: true
        end

        Visualization.repository  = 
          DataRepository::Backend::Sequel.new(@db, :visualizations)
        Overlay.repository        =
          DataRepository::Backend::Sequel.new(@db, :overlays)
      end #migrate
    end # Migrator
  end # Visualization
end # CartoDB

