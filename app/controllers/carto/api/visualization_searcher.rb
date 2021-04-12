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
        types = get_types_parameters

        validate_parameters(types, params)

        pattern = params[:q]

        only_liked = params[:only_liked] == 'true'
        only_shared = params[:only_shared] == 'true'
        only_subscriptions = params[:subscribed] == 'true'
        only_samples = params[:sample] == 'true'
        exclude_shared = params[:exclude_shared] == 'true'
        exclude_raster = params[:exclude_raster] == 'true'
        locked = params[:locked]
        shared = compose_shared(params[:shared], only_shared, exclude_shared)
        tags = params.fetch(:tags, '').split(',')
        tags = nil if tags.empty?
        bbox_parameter = params.fetch(:bbox,nil)
        privacy = params.fetch(:privacy,nil)
        only_with_display_name = params[:only_with_display_name] == 'true'
        with_dependent_visualizations = params[:with_dependent_visualizations].to_i
        only_published = params[:only_published] == 'true'

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

        vqb.with_published if only_published

        if current_user
          vqb.with_current_user_id(current_user.id)
          vqb.with_liked_by_user_id(current_user.id) if only_liked
          vqb.with_subscription if only_subscriptions
          vqb.with_sample if only_samples
          case shared
          when FILTER_SHARED_YES
            vqb.with_owned_by_or_shared_with_user_id(current_user.id)
          when FILTER_SHARED_NO
            vqb.with_user_id(current_user.id) if !only_liked
          when FILTER_SHARED_ONLY
            vqb.with_shared_with_user_id(current_user.id)
                .with_user_id_not(current_user.id)
          end

          vqb.without_raster if exclude_raster

          if locked == 'true'
            vqb.with_locked(true)
          elsif locked == 'false'
            vqb.with_locked(false)
          end

          if types.include? Carto::Visualization::TYPE_REMOTE
            vqb.without_synced_external_sources
            vqb.without_imported_remote_visualizations
          end

          vqb.with_privacy(privacy) unless privacy.nil?

          if with_dependent_visualizations.positive? && !current_user.has_feature_flag?('faster-dependencies')
            vqb.with_prefetch_dependent_visualizations
          end
        else
          user = Carto::User.where(username: CartoDB.extract_subdomain(request)).first
          raise Carto::ParamInvalidError.new(:username) unless user.present?
          vqb.with_user_id(user.id)
             .with_privacy(Carto::Visualization::PRIVACY_PUBLIC)
        end

        if pattern.present?
          vqb.with_partial_match(pattern)
        end

        vqb
      end

      def presenter_options_from_hash(params)
        options = {}

        params.each { |k, v| options[k.to_sym] = false if params[k].to_s == 'false' }

        options[:with_dependent_visualizations] = params[:with_dependent_visualizations].to_i

        options.slice(*Carto::Api::VisualizationPresenter::ALLOWED_PARAMS)
      end

      private

      def get_types_parameters
        # INFO: this fits types and type into types, so only types is used for search.
        # types defaults to type if empty.
        # types defaults to derived if type is also empty.
        types = params.fetch(:types, "").split(',')
        type = params[:type].present? ? params[:type] : (types.empty? ? nil : types[0])

        types = [type].compact if types.empty?
        types = [Carto::Visualization::TYPE_DERIVED] if types.empty?

        return types
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
