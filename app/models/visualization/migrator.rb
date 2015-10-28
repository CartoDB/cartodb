# encoding: utf-8
require 'sequel'
require_relative '../../../services/data-repository/backend/sequel'

# encoding: utf-8
module CartoDB
  module Visualization
    class Migrator
      def initialize(db)
        @db = db
      end

      def migrate(relation=:visualizations)
        @db.create_table(relation.to_sym) do
          UUID      :id, primary_key: true
          String    :name
          String    :display_name
          String    :description
          UUID      :map_id, index: true
          String    :active_layer_id
          String    :type
          String    :privacy
          DateTime  :created_at, null: false
          DateTime  :updated_at, null: false
          String    :encrypted_password
          String    :password_salt
          String    :url_options
          UUID      :user_id
          UUID      :permission_id
          Boolean   :locked
          String    :license
          String    :source
          String    :attributions
          String    :title
          String    :parent_id
          String    :kind
          String    :prev_id
          String    :next_id
          String    :slide_transition_options
          String    :active_child
        end

        @db.run(%Q{
          ALTER TABLE "#{relation}"
          ADD COLUMN tags text[],
          ADD COLUMN country_codes text[],
          ADD COLUMN bbox geometry
        })
      end

      def drop(relation=:visualizations)
        @db.drop_table(relation.to_sym, :cascade=>true)
      end
    end
  end
end

