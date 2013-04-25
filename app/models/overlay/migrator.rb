# encoding: utf-8
require 'sequel'
require_relative '../../../services/data-repository/backend/sequel'

module CartoDB
  module Overlay
    class Migrator
      def initialize(db)
        @db = db
      end #initialize

      def migrate
        @db.create_table :overlays do
          String    :id,                null: false, primary_key: true
          Integer   :order,             null: false
          String    :options,           text: true
          String    :type
          String    :visualization_id,  index: true
        end
      end #migrate
    end # Migrator
  end # Overlay
end # CartoDB

