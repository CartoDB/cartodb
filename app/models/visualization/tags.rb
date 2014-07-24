# encoding: utf-8

require_relative './member'
require_relative '../shared_entity'

module CartoDB
  module Visualization
    class Tags
      DEFAULT_LIMIT = 500

      def initialize(user, options={})
        @user = user
        @exclude_shared = options[:exclude_shared].present?
      end

      def names(params={})
        if only_shared?(params)
          filter = shared_entities_sql_filter(only_shared?(params))
          if filter.empty?
            return []
          else
            Tag.fetch(%Q{
              SELECT DISTINCT (unnest(tags)) as name
              FROM visualizations
              WHERE #{shared_entities_sql_filter(only_shared?(params))}
              AND type IN ?
              AND privacy IN ?
              #{locked_from(params)}
              LIMIT ?
            }, types_from(params), privacy_from(params), limit_from(params)
            ).map{ |tag| tag.name}
          end
        else
          Tag.fetch(%Q{
            SELECT DISTINCT (unnest(tags)) as name
            FROM visualizations
            WHERE user_id = ?
            AND type IN ?
            AND privacy IN ?
            #{locked_from(params)}
            #{shared_entities_sql_filter(only_shared?(params))}
            LIMIT ?
          }, user.id, types_from(params), privacy_from(params), limit_from(params)
            ).map{ |tag| tag.name}
        end
      end

      def count(params={})
        if only_shared?(params)
          filter = shared_entities_sql_filter(only_shared?(params))
          if filter.empty?
            return []
          else
            Tag.fetch(%Q{
            WITH tags as (
              SELECT unnest(tags) as name
              FROM visualizations
              WHERE #{shared_entities_sql_filter(only_shared?(params))}
              AND type IN ?
              #{locked_from(params)}
              LIMIT ?
            )
            SELECT name, count(*) as count
            FROM tags
            GROUP BY name
            ORDER BY count(*)
          }, types_from(params), limit_from(params)
            ).all.map(&:values)
          end
        else
          Tag.fetch(%Q{
            WITH tags as (
              SELECT unnest(tags) as name
              FROM visualizations
              WHERE user_id = ?
              AND type IN ?
              #{locked_from(params)}
              #{shared_entities_sql_filter(only_shared?(params))}
              LIMIT ?
            )
            SELECT name, count(*) as count
            FROM tags
            GROUP BY name
            ORDER BY count(*)
          }, user.id, types_from(params), limit_from(params)
          ).all.map(&:values)
        end
      end

      private
      
      attr_reader :user

      def shared_entities_sql_filter(only_shared = false)
        return '' if @exclude_shared

        ids = CartoDB::SharedEntity.where(
            recipient_id: @user.id,
            entity_type: CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
        ).all
        .map { |entity|
          entity.entity_id
        }
        return '' if ids.nil? || ids.empty?

        if only_shared
          "id IN ('#{ids.join("','")}')"
        else
          "OR id IN ('#{ids.join("','")}')"
        end
      end

      def locked_from(params={})
        locked = params.fetch(:locked, nil)
        if locked.nil?
          ""
        else
          locked = locked ? 'true' : 'false'
          "AND locked=#{locked}"
        end
      end

      def only_shared?(params)
        params[:only_shared].present?
      end

      def privacy_from(params={})
        privacy = params.fetch(:privacy, nil)
        (privacy.nil? || privacy.empty?) ? Member::PRIVACY_VALUES : [privacy]
      end

      def types_from(params={})
        type    = params.fetch(:type, nil)
        (type.nil? || type.empty?) ? [Member::CANONICAL_TYPE, Member::DERIVED_TYPE] : [type]
      end

      def limit_from(params={})
        (params.fetch(:limit, DEFAULT_LIMIT) || DEFAULT_LIMIT).to_i
      end
    end
  end
end