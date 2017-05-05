require_dependency 'carto/bounding_box_utils'

module Carto
  module Api
    module VisualizationSearcher

      FILTER_SHARED_YES = 'yes'
      FILTER_SHARED_NO = 'no'
      FILTER_SHARED_ONLY = 'only'

      # Creates a visualization query builder ready
      # to search based on params hash (can be request params).
      # It doesn't apply ordering or paging, just filtering.
      def query_builder_with_filter_from_hash(params)
        types, total_types = get_types_parameters

        validate_parameters(types, params)

        pattern = params[:q]

        only_liked = params[:only_liked] == 'true'
        only_shared = params[:only_shared] == 'true'
        exclude_shared = params[:exclude_shared] == 'true'
        exclude_raster = params[:exclude_raster] == 'true'
        locked = params[:locked]
        shared = compose_shared(params[:shared], only_shared, exclude_shared)
        tags = params.fetch(:tags, '').split(',')
        tags = nil if tags.empty?
        bbox_parameter = params.fetch(:bbox,nil)
        privacy = params.fetch(:privacy,nil)
        only_with_display_name = params[:only_with_display_name] == 'true'

        vqb = VisualizationQueryBuilder.new
                                       .with_prefetch_user
                                       .with_prefetch_table
                                       .with_prefetch_permission
                                       .with_prefetch_synchronization
                                       .with_prefetch_external_source
                                       .with_types(types)
                                       .with_tags(tags)

        if !bbox_parameter.blank?
          vqb.with_bounding_box(Carto::BoundingBoxUtils.parse_bbox_parameters(bbox_parameter))
        end

        # FIXME Patch to exclude legacy visualization from data-library #5097
        if only_with_display_name
          vqb.with_display_name
        end

        if current_user
          if only_liked
            vqb.with_liked_by_user_id(current_user.id)
          end

          case shared
          when FILTER_SHARED_YES
            vqb.with_owned_by_or_shared_with_user_id(current_user.id)
          when FILTER_SHARED_NO
            vqb.with_user_id(current_user.id) if !only_liked
          when FILTER_SHARED_ONLY
            vqb.with_shared_with_user_id(current_user.id)
                .with_user_id_not(current_user.id)
          end

          if exclude_raster
            vqb.without_raster
          end

          if locked == 'true'
            vqb.with_locked(true)
          elsif locked == 'false'
            vqb.with_locked(false)
          end

          if types.include? Carto::Visualization::TYPE_REMOTE
            vqb.without_synced_external_sources
            vqb.without_imported_remote_visualizations
          end

          if !privacy.nil?
            vqb.with_privacy(privacy)
          end

        else
          # TODO: ok, this looks like business logic, refactor
          subdomain = CartoDB.extract_subdomain(request)
          vqb.with_user_id(Carto::User.where(username: subdomain).first.id)
              .with_privacy(Carto::Visualization::PRIVACY_PUBLIC)
        end

        if pattern.present?
          vqb.with_partial_match(pattern)
        end

        vqb
      end

      def presenter_options_from_hash(params)
        options = {}
        options[:show_stats] = false if params[:show_stats].to_s == 'false'
        options[:show_likes] = false if params[:show_likes].to_s == 'false'
        options[:show_liked] = false if params[:show_liked].to_s == 'false'
        options[:show_table] = false if params[:show_table].to_s == 'false'
        options[:show_permission] = false if params[:show_permission].to_s == 'false'
        options[:show_uses_builder_features] = false if params[:show_uses_builder_features].to_s == 'false'
        options[:show_synchronization] = false if params[:show_synchronization].to_s == 'false'
        options[:show_table_size_and_row_count] = false if params[:show_table_size_and_row_count].to_s == 'false'
        options
      end

      private

      def get_types_parameters
        # INFO: this fits types and type into types, so only types is used for search.
        # types defaults to type if empty.
        # types defaults to derived if type is also empty.
        # total_types are the types used for total counts.
        types = params.fetch(:types, "").split(',')

        type = params[:type].present? ? params[:type] : (types.empty? ? nil : types[0])
        # TODO: add this assumption to a test or remove it (this is coupled to the UI)
        total_types = [(type == Carto::Visualization::TYPE_REMOTE ? Carto::Visualization::TYPE_CANONICAL : type)].compact

        types = [type].compact if types.empty?
        types = [Carto::Visualization::TYPE_DERIVED] if types.empty?

        return types, total_types
      end

      def compose_shared(shared, only_shared, exclude_shared)
        valid_shared = shared if [FILTER_SHARED_ONLY, FILTER_SHARED_NO, FILTER_SHARED_YES].include?(shared)
        return valid_shared if valid_shared

        if only_shared
          FILTER_SHARED_ONLY
        elsif exclude_shared
          FILTER_SHARED_NO
        elsif exclude_shared == false
          FILTER_SHARED_YES
        else
          # INFO: exclude_shared == nil && !only_shared
          nil
        end
      end

      def validate_parameters(types, parameters)
        if (!params.fetch(:bbox, nil).nil? && (types.length > 1 || !types.include?(Carto::Visualization::TYPE_CANONICAL)))
          raise CartoDB::BoundingBoxError.new('Filter by bbox is only supported for type table')
        end
      end
    end
  end
end
