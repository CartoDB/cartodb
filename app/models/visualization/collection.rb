# encoding: utf-8
require 'set'
require_relative './member'
require_relative '../shared_entity'
require_relative '../../../services/data-repository/structures/collection'

module CartoDB
  module Visualization
    SIGNATURE           = 'visualizations'
    # user_id filtered by default if present upon fetch()
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
      def initialize(attributes={}, options={})

        @total_entries = 0

        @collection = DataRepository::Collection.new(
          signature:    SIGNATURE,
          repository:   options.fetch(:repository, Visualization.repository),
          member_class: Member
        )
      end #initialize

      DataRepository::Collection::INTERFACE.each do |method_name|
        define_method(method_name) do |*arguments, &block|
          result = collection.send(method_name, *arguments, &block)
          return self if result.is_a?(DataRepository::Collection)
          result
        end
      end

      # NOTES:
      # - if user_id is present as filter, will fetch visualizations shared with the user,
      #   except if exclude_shared filter is also present
      # - only_shared forces to use different flow because if there are no shared there's nothing else to do
      def fetch(filters={})
        if filters[:only_shared].present?
          dataset = repository.collection
          dataset = filter_by_only_shared(dataset, filters)
        else
          dataset = repository.collection(filters,  %w{ user_id } )
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
          dataset = order(dataset, filters.delete(:o))

          @total_entries = dataset.count
          dataset = repository.paginate(dataset, filters)

          collection.storage = Set.new(dataset.map { |attributes|
            Visualization::Member.new(attributes)
          })
        end

        self
      end #fetch

      def store
        #map { |member| member.fetch.store }
        self
      end #store

      def destroy
        map(&:delete)
        self
      end #destroy

      def to_poro
        map { |member| member.to_hash(related: false, table_data: true) }
      end #to_poro

      attr_reader :total_entries

      private

      attr_reader :collection

      def order(dataset, criteria={})
        return dataset if criteria.nil? || criteria.empty?
        dataset.order(*order_params_from(criteria))
      end #order

      def filter_by_tags(dataset, tags=[])
        return dataset if tags.nil? || tags.empty?
        placeholders = tags.length.times.map { '?' }.join(', ')
        filter       = "tags && ARRAY[#{placeholders}]"
       
        dataset.where([filter].concat(tags))
      end #filter_by_tags

      def filter_by_partial_match(dataset, pattern=nil)
        return dataset if pattern.nil? || pattern.empty?
        dataset.where(PARTIAL_MATCH_QUERY, pattern, "%#{pattern}%")
      end #filter_by_partial_match

      def filter_by_only_shared(dataset, filters)
        return dataset unless (filters[:user_id].present? && filters[:only_shared].present?)

        shared_vis = user_shared_vis(filters[:user_id])

        if shared_vis.nil? || shared_vis.empty?
          nil
        else
          dataset.where(id: shared_vis).exclude(user_id: filters[:user_id])
        end
      end

      def include_shared_entities(dataset, filters)
        return dataset unless filters[:user_id].present?
        return dataset if filters[:exclude_shared].present?

        shared_vis = user_shared_vis(filters[:user_id])

        return dataset if shared_vis.nil? || shared_vis.empty?
        dataset.or(id: shared_vis)
      end

      def user_shared_vis(user_id)
        recipient_ids = [user_id]
        user = User.where(id: user_id).first
        if user.has_organization?
          recipient_ids << user.organization.id
        end

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
      end #tags_from

      def order_params_from(criteria)
        criteria.map { |key, order| Sequel.send(order.to_sym, key.to_sym) }
      end #order_params_from

    end # Collection
  end # Visualization
end # CartoDB

