require_relative 'visualization_presenter'
require_relative 'vizjson_presenter'
require_relative '../../../models/visualization/stats'

module Carto

  module Api

    class VisualizationsController < ::Api::ApplicationController

      # TODO: compare with older, there seems to be more optional authentication endpoints
      skip_before_filter :api_authorization_required, only: [:index, :vizjson2]
      before_filter :optional_api_authorization, only: [:index, :vizjson2]

      before_filter :id_and_schema_from_params
      before_filter :load_table, only: [:vizjson2]
      before_filter :load_visualization, only: [:likes_count, :likes_list, :is_liked, :show, :stats]
      ssl_required :index, :show
      ssl_allowed  :vizjson2, :likes_count, :likes_list, :is_liked

      FILTER_SHARED_YES = 'yes'
      FILTER_SHARED_NO = 'no'
      FILTER_SHARED_ONLY = 'only'

      def id_and_schema_from_params
        if params.fetch('id', nil) =~ /\./
          @id, @schema = params.fetch('id').split('.').reverse
        else
          @id, @schema = [params.fetch('id', nil), nil]
        end
      end

      def load_visualization
        @visualization = Visualization.where(id: @id).first
        return render(text: 'Visualization does not exist', status: 404) if @visualization.nil?
        return render(text: 'Visualization not viewable', status: 403) if !@visualization.is_viewable_by_user?(current_viewer)
      end

      def load_table
        # TODO: refactor this for vizjson, that uses to look for a visualization, so it should come first

        @table = UserTable.where(id: @id).first
        # TODO: id should _really_ contain either an id of a user_table or a visualization??
        # Some tests fail if not, and older controller works that way, but...
        if @table
          @visualization = @table.visualization
        else
          @table = Visualization.where(id: @id).first
          @visualization = @table
          # TODO: refactor load_table duplication
          return render(text: 'Visualization does not exist', status: 404) if @visualization.nil?
          return render(text: 'Visualization not viewable', status: 403) if !@visualization.is_viewable_by_user?(current_viewer)
        end
      end

      def show
        render_jsonp(to_json(@visualization))
      rescue KeyError
        head(404)
      end

      def index
        types, total_types = get_types_parameters
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 20).to_i
        order = (params[:order] || 'updated_at').to_sym
        pattern = params[:q]

        only_liked = params[:only_liked] == 'true'
        only_shared = params[:only_shared] == 'true'
        exclude_shared = params[:exclude_shared] == 'true'
        locked = params[:locked]
        shared = compose_shared(params[:shared], only_shared, exclude_shared)

        vqb = VisualizationQueryBuilder.new
            .with_prefetch_user
            .with_prefetch_table
            .with_prefetch_permission
            .with_prefetch_external_source
            .with_types(types)

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
          end

          if locked == 'true'
            vqb.with_locked(true)
          elsif locked == 'false'
            vqb.with_locked(false)
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

        # TODO: undesirable table hardcoding, needed for disambiguation. Look for
        # a better approach and/or move it to the query builder
        response = {
          visualizations: vqb.with_order("visualizations.#{order}", :desc).build_paged(page, per_page).map { |v| VisualizationPresenter.new(v, current_viewer, { related: false }).to_poro },
          total_entries: vqb.build.count
        }
        if current_user
          response.merge!({
            total_user_entries: VisualizationQueryBuilder.new.with_types(total_types).with_user_id(current_user.id).build.count,
            total_likes: VisualizationQueryBuilder.new.with_types(total_types).with_liked_by_user_id(current_user.id).build.count,
            total_shared: VisualizationQueryBuilder.new.with_types(total_types).with_shared_with_user_id(current_user.id).build.count
          })
        end
        render_jsonp(response)
      end

      def likes_count
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.count
        })
      end

      def likes_list
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.map { |like| { actor_id: like.actor } }
        })
      end

      def is_liked
        render_jsonp({
          id: @visualization.id,
          likes: @visualization.likes.count,
          liked: @visualization.is_liked_by_user_id?(current_viewer.id)
        })
      end

      def vizjson2
        set_vizjson_response_headers_for(@visualization)
        render_jsonp(Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).to_vizjson( { https_request: is_https? } ))
      rescue KeyError => exception
        render(text: exception.message, status: 403)
      rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
        CartoDB.notify_exception(exception, { user: current_user, template_data: exception.template_data })
        render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
      rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
        CartoDB.notify_exception(exception)
        render_jsonp({ errors: { named_map: exception.message } }, 400)
      rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
        CartoDB.notify_exception(exception)
        render_jsonp({ errors: { named_maps: exception.message } }, 400)
      rescue => exception
        CartoDB.notify_exception(exception)
        raise exception
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

      def set_vizjson_response_headers_for(visualization)
        # We don't cache non-public vis
        if @visualization.is_publically_accesible?
          response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
          response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_VIZJSON} #{visualization.surrogate_key}"
          response.headers['Cache-Control']   = 'no-cache,max-age=86400,must-revalidate, public'
        end
      end

      def to_json(visualization)
        ::JSON.dump(to_hash(visualization))
      end

      def to_hash(visualization)
        # TODO: previous controller uses public_fields_only option which I don't know if is still used
        VisualizationPresenter.new(visualization, current_viewer).to_poro
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

    end

  end

end
