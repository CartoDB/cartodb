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
      FILTER_SHARED_YES = 'yes'
      FILTER_SHARED_NO = 'no'
      FILTER_SHARED_ONLY = 'only'

      ORDERING_RELATED_ATTRIBUTES = [:likes, :mapviews, :row_count, :size]

      # Same as services/data-repository/backend/sequel.rb
      PAGE          = 1
      PER_PAGE      = 300

      ALL_RECORDS = 999999

      def initialize(attributes={}, options={})
        @total_entries = 0

        @collection = DataRepository::Collection.new(
          signature:    SIGNATURE,
          repository:   options.fetch(:repository, Visualization.repository),
          member_class: Member
        )
        @can_paginate = true
        @lazy_order_by = nil
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
        dataset = compute_sharing_filter_dataset(filters)

        if dataset.nil?
          @total_entries = 0
          collection.storage = Set.new
        else
          dataset = apply_filters(dataset, filters)

          @total_entries = dataset.count

          if @can_paginate
            dataset = repository.paginate(dataset, filters, @total_entries)
            collection.storage = Set.new(dataset.map { |attributes|
              Visualization::Member.new(attributes)
            })
          else
            items = dataset.map { |attributes|
              Visualization::Member.new(attributes)
            }
            items = lazy_order_by(items, @lazy_order_by)
            # Manual paging
            page = (filters.delete(:page) || PAGE).to_i
            per_page = (filters.delete(:per_page) || PER_PAGE).to_i
            items = items.slice((page - 1) * per_page, per_page)
            collection.storage = Set.new(items)
          end
        end

        self
      end

      def count_query(filters={})
        dataset = compute_sharing_filter_dataset(filters)
        dataset.nil? ? 0 : apply_filters(dataset, filters).count
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

      def compute_sharing_filter_dataset(filters)
        shared_filter = filters.delete(:shared)
        case shared_filter
          when FILTER_SHARED_YES
            filters[:only_shared] = false
            filters[:exclude_shared] = false
          when FILTER_SHARED_NO
            filters[:only_shared] = false
            filters[:exclude_shared] = true
          when FILTER_SHARED_ONLY
            filters[:only_shared] = true
            filters[:exclude_shared] = false
        end

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
        dataset
      end

      def apply_filters(dataset, filters)
        dataset = repository.apply_filters(dataset, filters, AVAILABLE_FILTERS)
        dataset = filter_by_tags(dataset, tags_from(filters))
        dataset = filter_by_partial_match(dataset, filters.delete(:q))
        dataset = filter_by_kind(dataset, filters.delete(:exclude_raster))
        order(dataset, filters.delete(:o))
      end

      # Note: Not implemented ascending order for now, all are descending sorts
      def lazy_order_by(objects, field)
        case field
          when :likes
            objects.sort! { |obj_a, obj_b|
              obj_b.likes.count <=> obj_a.likes.count
            }
          when :mapviews
            objects.sort! { |obj_a, obj_b|
              # Stats have format [ date, value ]
              obj_b.stats.collect{|o| o[1] }.reduce(:+) <=> obj_a.stats.collect{|o| o[1] }.reduce(:+)
            }
          when :row_count
            objects.sort! { |obj_a, obj_b|
              a_rows = (obj_a.table.nil? ? 0 : obj_a.table.rows_and_size.fetch(:rows)) || 0
              b_rows = (obj_b.table.nil? ? 0 : obj_b.table.rows_and_size.fetch(:rows)) || 0
              b_rows <=> a_rows
            }
          when :size
            objects.sort! { |obj_a, obj_b|
              a_size = (obj_a.table.nil? ? 0 : obj_a.table.rows_and_size.fetch(:size)) || 0
              b_size = (obj_b.table.nil? ? 0 : obj_b.table.rows_and_size.fetch(:size)) || 0
              b_size <=> a_size
            }
        end
        objects
      end

      # Note: Not implemented ascending order for now
      def order_by_related_attribute(dataset, criteria)
        @can_paginate = false
        @lazy_order_by = criteria.keys.first
        dataset
      end

      def order_by_base_attribute(dataset, criteria={})
        @can_paginate = true
        dataset.order(*criteria.map { |key, order| Sequel.send(order, key) })
      end

      # Allows to order by any CartoDB::Visualization::Member attribute (eg: updated_at), plus:
      # - likes
      # - mapviews
      def order(dataset, criteria={})
        # {"updated_at"=>"desc"}
        return dataset if criteria.nil? || criteria.empty?
        criteria = criteria.map { |key, order| { key.to_sym => order.to_sym} }
                           .first   # Multiple ordering not required
        if ORDERING_RELATED_ATTRIBUTES.include? criteria.keys.first
          order_by_related_attribute(dataset, criteria)
        else
          order_by_base_attribute(dataset, criteria)
        end
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

      def filter_by_kind(dataset, filter_value)
        return dataset if filter_value.nil? || !filter_value
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

    end
  end
end

