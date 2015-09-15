# encoding: UTF-8

require 'active_record'

module Carto
  class Notification

      MAP_LIKE_NOTIFICATION = :map_like
      TABLE_LIKE_NOTIFICATION = :table_like
      SHARE_TABLE_NOTIFICATION = :share_table
      SHARE_VISUALIZATION_NOTIFICATION = :share_visualization
      DATA_IMPORT_FINISHED_NOTIFICATION = :data_import
      GEOCODING_NOTIFICATION = :geocoding
      TREND_MAP_NOTIFICATION = :trend_map
      NEWSLETTER_NOTIFICATION = :newsletter

      NOTIFICATIONS_TYPE = [
        MAP_LIKE_NOTIFICATION,
        SHARE_TABLE_NOTIFICATION,
        SHARE_VISUALIZATION_NOTIFICATION,
        DATA_IMPORT_FINISHED_NOTIFICATION,
        GEOCODING_NOTIFICATION,
        TREND_MAP_NOTIFICATION,
        NEWSLETTER_NOTIFICATION
      ]

      def self.types
        return NOTIFICATIONS_TYPE
      end

  end
end
