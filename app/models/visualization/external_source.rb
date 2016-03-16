# encoding: UTF-8

require 'sequel'
require_relative './member'

module CartoDB
  module Visualization

    class ExternalSource < Sequel::Model
      many_to_one :visualization

      def validate
        validates_presence :visualization_id
        validates_presence :import_url
        # TODO: retrieve geometry_types
        #validates_presence :geometry_types
        validates_presence :rows_counted
        validates_presence :size
      end

      def initialize(visualization_id, import_url, geometry_types, rows_counted, size, username = nil)
        super({ visualization_id: visualization_id, import_url: import_url, geometry_types: geometry_types, rows_counted: rows_counted, size: size, username: username })
      end

      def update_data(import_url, geometry_types, rows_counted, size, username = nil)
        self.import_url = import_url
        self.geometry_types = geometry_types
        self.rows_counted = rows_counted
        self.size = size
        self.username = username
        self
      end

      def importable_by(user)
        user.present? && visualization.user_id == user.id
      end

      def visualization
        @visualization ||= CartoDB::Visualization::Member.new(id: visualization_id).fetch
      end

    end

  end
end
