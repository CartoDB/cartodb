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
    AVAILABLE_FILTERS   = %w{ name type description map_id privacy id parent_id }
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

      FILTER_UNAUTHENTICATED = :unauthenticated
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
        @unauthenticated_flag = false
        @user_id = nil
        @type = nil
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
        @user_id = filters.fetch(:user_id, nil)
        filters = restrict_filters_if_unauthenticated(filters)
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

      def delete_if(&block)
        collection.delete_if(&block)
      end

      # This method is not used for anything but called from the DataRepository::Collection interface above
      def store
        self
      end

      def count_query(filters={})
        dataset = compute_sharing_filter_dataset(filters)
        dataset.nil? ? 0 : apply_filters(dataset, filters).count
      end

      def destroy
        map(&:delete)
        self
      end

      def to_poro
        map { |member| member.to_hash(related: false, table_data: true) }
      end

      # Warning, this is a cached count, do not use if adding/removing collection items
      # @throws KeyError
      def total_shared_entries(raise_on_error = false)
        user_shared_count = org_shared_count = 0

        unless @unauthenticated_flag
          if @user_id.nil? && raise_on_error
            raise KeyError.new("Can't retrieve shared count without specifying user id")
          else
            user_shared_count = CartoDB::SharedEntity.select(:entity_id)
              .where(:recipient_id => @user_id,
                   :entity_type => CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION,
                   :recipient_type => CartoDB::SharedEntity::RECIPIENT_TYPE_USER)
            if @type.nil?
              user_shared_count = user_shared_count.join(:visualizations,
                                                         :visualizations__id.cast(:uuid) => :entity_id)
            else
              user_shared_count = user_shared_count.join(:visualizations,
                                                         :visualizations__id.cast(:uuid) => :entity_id,
                                                         :type => @type)
            end
            user_shared_count = user_shared_count.count

            user = User.where(id: @user_id).first
            if user.nil? || user.organization.nil?
              org_shared_count = 0
            else
              org_shared_count = CartoDB::SharedEntity.select(:entity_id)
              .where(:recipient_id => user.organization_id,
                     :entity_type => CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION,
                     :recipient_type => CartoDB::SharedEntity::RECIPIENT_TYPE_ORGANIZATION)
              if @type.nil?
                org_shared_count = org_shared_count.join(:visualizations,
                                                         :visualizations__id.cast(:uuid) => :entity_id)
              else
                org_shared_count = org_shared_count.join(:visualizations,
                                                         :visualizations__id.cast(:uuid) => :entity_id,
                                                          :type => @type)
              end
              org_shared_count = org_shared_count.count
            end
          end
        end
        user_shared_count + org_shared_count
      end

      # @throws KeyError
      def total_liked_entries(raise_on_error = false)
        if @user_id.nil? && raise_on_error
            raise KeyError.new("Can't retrieve likes count without specifying user id")
        else
          # Inner join with visualizations to filter by type and user, then applied a distinct count
          if @unauthenticated_flag
            likes_count = CartoDB::Like.select(:subject)
            if @type.nil?
              likes_count = likes_count.join(:visualizations,
                                             :id.cast(:uuid) => :subject,
                                             :user_id => @user_id,
                                             :privacy => Visualization::Member::PRIVACY_PUBLIC)
            else
              likes_count = likes_count.join(:visualizations,
                                             :id.cast(:uuid) => :subject,
                                             :user_id => @user_id,
                                             :type => @type,
                                             :privacy => Visualization::Member::PRIVACY_PUBLIC)
            end
            likes_count = likes_count.distinct.count
          else
            likes_count = CartoDB::Like.select(:subject)
            if @type.nil?
              likes_count = likes_count.join(:visualizations,
                                             :id.cast(:uuid) => :subject,
                                             :user_id => @user_id)
            else
              likes_count = likes_count.join(:visualizations,
                                             :id.cast(:uuid) => :subject,
                                             :user_id => @user_id,
                                             :type => @type)
            end
            likes_count = likes_count.distinct.count
          end
        end
        likes_count
      end

      attr_reader :total_entries

      private

      attr_reader :collection

      # If special filter unauthenticated: true is present, will restrict data
      def restrict_filters_if_unauthenticated(filters)
        @unauthenticated_flag = false
        unless filters.delete(FILTER_UNAUTHENTICATED).nil?
          filters[:exclude_shared] = true
          filters[:privacy] = Visualization::Member::PRIVACY_PUBLIC
          filters.delete(:locked)
          filters.delete(:map_id)
          @unauthenticated_flag = true
        end
        filters
      end

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
        @type = filters.fetch(:type, nil)
        dataset = repository.apply_filters(dataset, filters, AVAILABLE_FILTERS)
        dataset = filter_by_tags(dataset, tags_from(filters))
        dataset = filter_by_partial_match(dataset, filters.delete(:q))
        dataset = filter_by_kind(dataset, filters.delete(:exclude_raster))
        order(dataset, filters.delete(:order))
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
              a_rows = (obj_a.table.nil? ? 0 : obj_a.table.row_count_and_size.fetch(:row_count)) || 0
              b_rows = (obj_b.table.nil? ? 0 : obj_b.table.row_count_and_size.fetch(:row_count)) || 0
              b_rows <=> a_rows
            }
          when :size
            objects.sort! { |obj_a, obj_b|
              a_size = (obj_a.table.nil? ? 0 : obj_a.table.row_count_and_size.fetch(:size)) || 0
              b_size = (obj_b.table.nil? ? 0 : obj_b.table.row_count_and_size.fetch(:size)) || 0
              b_size <=> a_size
            }
        end
        objects
      end

      # Note: Not implemented ascending order for now
      def order_by_related_attribute(dataset, criteria)
        @can_paginate = false
        @lazy_order_by = criteria
        dataset
      end

      def order_by_base_attribute(dataset, criteria)
        @can_paginate = true
        dataset.order(Sequel.send(:desc, criteria))
      end

      # Allows to order by any CartoDB::Visualization::Member attribute (eg: updated_at, created_at), plus:
      # - likes
      # - mapviews
      # - row_count
      # - size
      def order(dataset, criteria=nil)
        return dataset if criteria.nil? || criteria.empty?
        criteria = criteria.to_sym
        if ORDERING_RELATED_ATTRIBUTES.include? criteria
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

