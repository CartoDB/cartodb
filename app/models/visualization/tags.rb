require_relative './member'

module CartoDB
  module Visualization
    class Tags
      DEFAULT_LIMIT = 500

      def initialize(user, options={})
        @user = user
        @exclude_shared = options[:exclude_shared].present? && options[:exclude_shared] == true
      end

      def names(params = {})
        if only_shared?(params)
          filter = shared_entities_sql_filter(params)
          if filter.empty?
            return []
          else
            Carto::Tag.find_by_sql(
              [%{
                SELECT DISTINCT (unnest(tags)) as name
                FROM visualizations
                WHERE #{shared_entities_sql_filter(params)}
                AND type IN (?)
                AND privacy IN (?)
                #{locked_from(params)}
                LIMIT ?
              }, types_from(params), privacy_from(params), limit_from(params)]
            ).map(&:name)
          end
        else
          Carto::Tag.find_by_sql(
            [%{
              SELECT DISTINCT (unnest(tags)) as name
              FROM visualizations
              WHERE user_id = ?
              AND type IN (?)
              AND privacy IN (?)
              #{locked_from(params)}
              #{shared_entities_sql_filter(params)}
              LIMIT ?
            }, user.id, types_from(params), privacy_from(params), limit_from(params)]
          ).map(&:name)
        end
      end

      def count(params={})
        if only_shared?(params)
          filter = shared_entities_sql_filter(params)
          if filter.empty?
            return []
          else
            Carto::Tag.find_by_sql(
              [%{
                WITH tags as (
                  SELECT unnest(tags) as name
                  FROM visualizations
                  WHERE #{shared_entities_sql_filter(params)}
                  AND type IN (?)
                  #{locked_from(params)}
                  LIMIT ?
                )
                SELECT name, count(*) as count
                FROM tags
                GROUP BY name
                ORDER BY count(*)
              }, types_from(params), limit_from(params)]
            ).all.map(&:values)
          end
        else
          Carto::Tag.find_by_sql(
            [%{
              WITH tags as (
                SELECT unnest(tags) as name
                FROM visualizations
                WHERE user_id = ?
                AND type IN (?)
                #{locked_from(params)}
                #{shared_entities_sql_filter(params)}
                LIMIT ?
              )
              SELECT name, count(*) as count
              FROM tags
              GROUP BY name
              ORDER BY count(*)
            }, user.id, types_from(params), limit_from(params)]
          ).all.map(&:values)
        end
      end

      private

      attr_reader :user

      def shared_entities_sql_filter(params)
        return '' if @exclude_shared

        only_shared = only_shared?(params)

        ids = Carto::SharedEntity.where(
          recipient_id: @user.id,
          entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
        ).pluck(:entity_id)
        return '' if ids.nil? || ids.empty?

        if only_shared
          "id IN ('#{ids.join("','")}')"
        else
          types_filter = types_from(params)
          if types_filter.size  == 1
            types_fragment = " AND type IN ('#{types_filter.first}')"
          else
            types_fragment = ''
          end

          "OR (id IN ('#{ids.join("','")}') #{types_fragment})"
        end
      end

      def locked_from(params={})
        locked = params.fetch(:locked, nil)
        if locked.nil?
          ""
        else
          locked = locked.to_s == 'true' ? 'true' : 'false'
          "AND locked=#{locked}"
        end
      end

      def only_shared?(params)
        params[:only_shared].present? && params[:only_shared] == true
      end

      def privacy_from(params={})
        privacy = params.fetch(:privacy, nil)
        (privacy.nil? || privacy.empty?) ? Member::PRIVACY_VALUES : [privacy]
      end

      def types_from(params={})
        type = params.fetch(:type, nil)
        (type.nil? || type.empty?) ? [Member::TYPE_CANONICAL, Member::TYPE_DERIVED] : [type]
      end

      def limit_from(params={})
        (params.fetch(:limit, DEFAULT_LIMIT) || DEFAULT_LIMIT).to_i
      end
    end
  end
end
