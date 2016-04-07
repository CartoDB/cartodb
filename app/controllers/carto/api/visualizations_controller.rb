require_relative 'visualization_presenter'
require_dependency 'carto/api/vizjson_presenter'
require_relative '../../../models/visualization/stats'
require_relative 'paged_searcher'
require_relative '../controller_helper'
require_dependency 'carto/uuidhelper'
require_dependency 'static_maps_url_helper'
require_relative 'vizjson3_presenter'

module Carto
  module Api
    class VisualizationsController < ::Api::ApplicationController
      include VisualizationSearcher
      include PagedSearcher
      include Carto::UUIDHelper
      include Carto::ControllerHelper
      include VisualizationsControllerHelper

      ssl_required :index, :show
      ssl_allowed  :vizjson2, :vizjson3, :likes_count, :likes_list, :is_liked, :list_watching, :static_map

      # TODO: compare with older, there seems to be more optional authentication endpoints
      skip_before_filter :api_authorization_required, only: [:index, :vizjson2, :vizjson3, :is_liked, :static_map]
      before_filter :optional_api_authorization, only: [:index, :vizjson2, :vizjson3, :is_liked, :static_map]

      before_filter :id_and_schema_from_params
      before_filter :load_by_name_or_id, only: [:vizjson2, :vizjson3]
      before_filter :load_visualization, only: [:likes_count, :likes_list, :is_liked, :show, :stats, :list_watching,
                                                :static_map]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UUIDParameterFormatError, with: :rescue_from_carto_error

      def show
        render_jsonp(to_json(@visualization))
      rescue KeyError
        head(404)
      end

      def index
        page, per_page, order = page_per_page_order_params
        types, total_types = get_types_parameters
        vqb = query_builder_with_filter_from_hash(params)

        presenter_cache = Carto::Api::PresenterCache.new

        # TODO: undesirable table hardcoding, needed for disambiguation. Look for
        # a better approach and/or move it to the query builder
        response = {
          visualizations: vqb.with_order("visualizations.#{order}", :desc).build_paged(page, per_page).map { |v|
              VisualizationPresenter.new(v, current_viewer, self, { related: false }).with_presenter_cache(presenter_cache).to_poro
          },
          total_entries: vqb.build.count
        }
        if current_user
          # Prefetching at counts removes duplicates
          response.merge!({
            total_user_entries: VisualizationQueryBuilder.new.with_types(total_types).with_user_id(current_user.id).build.count,
            total_likes: VisualizationQueryBuilder.new.with_types(total_types).with_liked_by_user_id(current_user.id).build.count,
            total_shared: VisualizationQueryBuilder.new.with_types(total_types).with_shared_with_user_id(current_user.id).with_user_id_not(current_user.id).with_prefetch_table.build.count
          })
        end
        render_jsonp(response)
      rescue CartoDB::BoundingBoxError => e
        render_jsonp({ error: e.message }, 400)
      rescue => e
        CartoDB::Logger.error(exception: e)
        render_jsonp({ error: e.message }, 500)
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
          liked: current_viewer ? @visualization.is_liked_by_user_id?(current_viewer.id) : false
        })
      end

      def vizjson2
        render_vizjson(generate_vizjson2)
      end

      def vizjson3
        render_vizjson(generate_vizjson3(@visualization, params))
      end

      def list_watching
        return(head 403) unless @visualization.is_viewable_by_user?(current_user)
        watcher = CartoDB::Visualization::Watcher.new(current_user, @visualization)
        render_jsonp(watcher.list)
      end

      def static_map
        # Abusing here of .to_i fallback to 0 if not a proper integer
        map_width = params.fetch('width',nil).to_i
        map_height = params.fetch('height', nil).to_i

        # @see https://github.com/CartoDB/Windshaft-cartodb/blob/b59e0a00a04f822154c6d69acccabaf5c2fdf628/docs/Map-API.md#limits
        if map_width < 2 || map_height < 2 || map_width > 8192 || map_height > 8192
          return(head 400)
        end

        response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
        response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_VIZJSON} #{@visualization.surrogate_key}"
        response.headers['Cache-Control']   = "max-age=86400,must-revalidate, public"

        redirect_to Carto::StaticMapsURLHelper.new.url_for_static_map(request, @visualization, map_width, map_height)
      end

      private

      def generate_vizjson2
        Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).to_vizjson(https_request: is_https?)
      end

      def render_vizjson(vizjson)
        set_vizjson_response_headers_for(@visualization)
        render_jsonp(vizjson)
      rescue KeyError => exception
        render(text: exception.message, status: 403)
      rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
        CartoDB.notify_exception(exception, user: current_user, template_data: exception.template_data)
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

      def load_by_name_or_id
        @table =  is_uuid?(@id) ? Carto::UserTable.where(id: @id).first  : nil

        # INFO: id should _really_ contain either an id of a user_table or a visualization, but for legacy reasons...
        if @table
          @visualization = @table.visualization
        else
          load_visualization
          @table = @visualization
        end
      end

      def load_visualization
        @visualization = load_visualization_from_id_or_name(params[:id])

        if @visualization.nil?
          raise Carto::LoadError.new('Visualization does not exist', 404)
        end
        if !@visualization.is_viewable_by_user?(current_viewer)
          raise Carto::LoadError.new('Visualization not viewable', 403)
        end
        unless request_username_matches_visualization_owner
          raise Carto::LoadError.new('Visualization of that user does not exist', 404)
        end
      end

      # This avoids crossing usernames and visualizations.
      # Remember that the url of a visualization shared with a user contains that user's username instead of owner's
      def request_username_matches_visualization_owner
        # Support both for username at `/u/username` and subdomain, prioritizing first
        username = [CartoDB.username_from_request(request), CartoDB.subdomain_from_request(request)].compact.first
        # URL must always contain username, either at subdomain or at path.
        # Domainless url documentation: http://cartodb.readthedocs.org/en/latest/configuration.html#domainless-urls
        return false unless username.present?

        # Either user is owner or is current and has permission
        # R permission check is based on current_viewer because current_user assumes you're viewing your subdomain
        username == @visualization.user.username ||
          (current_user && username == current_user.username && @visualization.has_read_permission?(current_viewer))
      end

      def id_and_schema_from_params
        if params.fetch('id', nil) =~ /\./
          @id, @schema = params.fetch('id').split('.').reverse
        else
          @id, @schema = [params.fetch('id', nil), nil]
        end
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
        VisualizationPresenter.new(visualization, current_viewer, self).to_poro
      end

    end
  end
end
