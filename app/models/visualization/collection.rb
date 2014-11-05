# encoding: utf-8
require 'set'
require_relative './member'
require_relative './overlays'
require_relative '../shared_entity'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Visualization
    SIGNATURE           = 'visualizations'
    # 'user_id' filtered by default if present upon fetch()
    # 'locked' is filtered but before the rest
    AVAILABLE_FILTERS   = %w{ name type description map_id privacy id }
    PARTIAL_MATCH_QUERY = %Q{
      to_tsvector(
        'english', coalesce(name, '') || ' ' 
        || coalesce(description, '')
      ) @@ plainto_tsquery('english', ?) 
      OR CONCAT(name, ' ', description) ILIKE ?
    }

    class << self
      attr_accessor :repository
    end
    
    class Collection
      ALL_RECORDS = 999999

      def initialize(attributes={}, options={})
        @total_entries = 0

        @collection = DataRepository::Collection.new(
          signature:    SIGNATURE,
          repository:   options.fetch(:repository, Visualization.repository),
          member_class: Member
        )
      end

      DataRepository::Collection::INTERFACE.each do |method_name|
        define_method(method_name) do |*arguments, &block|
          result = collection.send(method_name, *arguments, &block)
          return self if result.is_a?(DataRepository::Collection)
          result
        end
      end

      # NOTES:
      # - if user_id is present as filter, will fetch visualizations shared with the user,
      #   except if exclude_shared filter is also present and true,
      # - only_shared forces to use different flow because if there are no shared there's nothing else to do
      # - locked filter has special behaviour
      def fetch(filters={})
        if filters[:only_shared].present? && filters[:only_shared].to_s == 'true'
          dataset = repository.collection
          dataset = filter_by_only_shared(dataset, filters)
        else
          dataset = repository.collection(filters,  %w{ user_id })
          locked_filter = filters.delete(:locked)
          unless locked_filter.nil?
            if locked_filter.to_s == 'true'
              locked_filter = true
              filters[:exclude_shared] = true
            else
              locked_filter = locked_filter.to_s == 'false' ? false : nil
            end
          end
          dataset = repository.apply_filters(dataset, {locked: locked_filter}, ['locked']) unless locked_filter.nil?
          dataset = include_shared_entities(dataset, filters)
        end

        if dataset.nil?
          @total_entries = 0
          collection.storage = Set.new
        else
          # 2) Filter
          dataset = repository.apply_filters(dataset, filters, AVAILABLE_FILTERS)
          dataset = filter_by_tags(dataset, tags_from(filters))
          dataset = filter_by_partial_match(dataset, filters.delete(:q))
          dataset = filter_by_kind(dataset, filters)
          dataset = order(dataset, filters.delete(:o))

          @total_entries = dataset.count
          dataset = repository.paginate(dataset, filters)

          collection.storage = Set.new(dataset.map { |attributes|
            Visualization::Member.new(attributes)
          })
        end

        self
      end

      def store
        #map { |member| member.fetch.store }
        self
      end

      def destroy
        map(&:delete)
        self
      end

      def to_poro
        map { |member| member.to_hash(related: false, table_data: true) }
      end

      attr_reader :total_entries

      private

      attr_reader :collection

      def order(dataset, criteria={})
        return dataset if criteria.nil? || criteria.empty?
        dataset.order(*order_params_from(criteria))
      end

      def filter_by_tags(dataset, tags=[])
        return dataset if tags.nil? || tags.empty?
        placeholders = tags.length.times.map { '?' }.join(', ')
        filter       = "tags && ARRAY[#{placeholders}]"
       
        dataset.where([filter].concat(tags))
      end

      def filter_by_partial_match(dataset, pattern=nil)
        return dataset if pattern.nil? || pattern.empty?
        dataset.where(PARTIAL_MATCH_QUERY, pattern, "%#{pattern}%")
      end

      def filter_by_kind(dataset, filters)
        return dataset unless filters[:exclude_raster].present? && filters[:exclude_raster].to_s == 'true'
        dataset.where('kind=?', Member::KIND_GEOM)
      end

      def filter_by_only_shared(dataset, filters)
        return dataset \
          unless (filters[:user_id].present? && filters[:only_shared].present? && filters[:only_shared].to_s == 'true')

        shared_vis = user_shared_vis(filters[:user_id])

        if shared_vis.nil? || shared_vis.empty?
          nil
        else
          dataset.where(id: shared_vis).exclude(user_id: filters[:user_id])
        end
      end

      def include_shared_entities(dataset, filters)
        return dataset unless filters[:user_id].present?
        return dataset if filters[:exclude_shared].present? && filters[:exclude_shared].to_s == 'true'

        shared_vis = user_shared_vis(filters[:user_id])

        return dataset if shared_vis.nil? || shared_vis.empty?
        dataset.or(id: shared_vis)
      end

      def user_shared_vis(user_id)
        recipient_ids = user_id.is_a?(Array) ? user_id : [user_id]
        User.where(id: user_id).each { |user|
          if user.has_organization?
            recipient_ids << user.organization.id
          end
        }

        CartoDB::SharedEntity.where(
            recipient_id: recipient_ids,
            entity_type: CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
        ).all
        .map { |entity|
          entity.entity_id
        }
      end

      def tags_from(filters={})
        filters.delete(:tags).to_s.split(',')
      end

      def order_params_from(criteria)
        criteria.map { |key, order| Sequel.send(order.to_sym, key.to_sym) }
      end

    end
  end
end

