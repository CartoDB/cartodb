# encoding: utf-8

require_relative './member'

module CartoDB
  module Visualization
    class Tags
      DEFAULT_LIMIT = 500

      def initialize(user)
        @user = user
      end #initialize

      def names(params={})
        Tag.fetch(%Q{
            SELECT DISTINCT (unnest(tags)) as name
            FROM visualizations
            WHERE map_id IN ?
            AND type IN ?
            AND privacy IN ?
            LIMIT ?
          }, map_ids_for(user), types_from(params), privacy_from(params), limit_from(params)
        ).map{ |tag| tag.name}
      end #names

      def count(params={})
        Tag.fetch(%Q{
            WITH tags as (
              SELECT unnest(tags) as name
              FROM visualizations
              WHERE map_id IN ?
              AND type IN ?
              LIMIT ?
            )
            SELECT name, count(*) as count
            FROM tags
            GROUP BY name
            #{order_from(params)}
          }, map_ids_for(user), types_from(params), limit_from(params)
        ).all.map(&:values)
      end #count

      private
      
      attr_reader :user

      def map_ids_for(user)
        user.maps.map(&:id)
      end #map_ids

      def order_from(params={})
        order = params.fetch(:order, nil)
        (order.nil? || order.empty?) ? ' ORDER BY count(*) ' : " ORDER BY #{order} "
      end #order_from

      def privacy_from(params={})
        privacy = params.fetch(:privacy, nil)
        (privacy.nil? || privacy.empty?) ? Member::PRIVACY_VALUES : [privacy]
      end #privacy_from

      def types_from(params={})
        type    = params.fetch(:type, nil)
        (type.nil? || type.empty?) ? [Member::CANONICAL_TYPE, Member::DERIVED_TYPE] : [type]
      end #type_filter_from

      def limit_from(params={})
        (params.fetch(:limit, DEFAULT_LIMIT) || DEFAULT_LIMIT).to_i
      end #limit_from
    end # Tags
  end # Visualization   
end # CartoDB

