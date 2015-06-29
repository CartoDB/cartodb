require_relative 'visualization_presenter'
require_relative 'vizjson_presenter'
require_relative '../../../models/visualization/stats'
require_relative 'paged_searcher'
require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class VisualizationsController < ::Api::ApplicationController
      include VisualizationSearcher
      include PagedSearcher
      include Carto::UUIDHelper

      ssl_required :index, :show
      ssl_allowed  :vizjson2, :likes_count, :likes_list, :is_liked, :list_watching, :static_map

      # TODO: compare with older, there seems to be more optional authentication endpoints
      skip_before_filter :api_authorization_required, only: [:index, :vizjson2, :is_liked, :static_map]
      before_filter :optional_api_authorization, only: [:index, :vizjson2, :is_liked, :static_map]

      before_filter :id_and_schema_from_params
      before_filter :load_by_name_or_id, only: [:vizjson2]
      before_filter :load_visualization, only: [:likes_count, :likes_list, :is_liked, :show, :stats, :list_watching,
                                                :static_map]

      def show
        render_jsonp(to_json(@visualization))
      rescue KeyError
        head(404)
      end

      def index
        page, per_page, order = page_per_page_order_params
        types, total_types = get_types_parameters
        vqb = query_builder_with_filter_from_hash(params)

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
            total_shared: VisualizationQueryBuilder.new.with_types(total_types).with_shared_with_user_id(current_user.id).with_user_id_not(current_user.id).build.count
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
          liked: current_viewer ? @visualization.is_liked_by_user_id?(current_viewer.id) : false
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
        response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

        final_url = static_maps_base_url(request) + 
                    static_maps_image_url_fragment(@visualization.id, map_width, map_height)

        redirect_to final_url
      end

      private

      # INFO: Assumes no trailing '/' comes inside, so returned string doesn't has it either
      def static_maps_base_url(request)
        config = get_static_maps_api_cdn_config

        username = CartoDB.extract_subdomain(request)
        request_protocol = request.protocol.sub('://','')

        if !config.nil? && !config.empty?
          # Sample formats:
          # {protocol}://{user}.cartodb.com
          # {protocol}://zone.cartocdn.com/{user}
          base_url = config
        else
          # Typical format (but all parameters except {user} come already replaced): 
          # {protocol}://{user}.{maps_domain}:{port}/
          base_url = ApplicationHelper.maps_api_template('public')
        end

        base_url.sub('{protocol}', CartoDB.protocol(request_protocol))
                .sub('{user}', username)
      end

      # INFO: To ease testing while we keep the config in a global array...
      def get_static_maps_api_cdn_config
        Cartodb.config[:maps_api_cdn_template]
      end

      def static_maps_image_url_fragment(visualization_id, width, height)
        template_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(visualization_id)

        "/api/v1/map/static/named/#{template_id}/#{width}/#{height}.png"
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
        # Implicit order due to legacy code: 1st return canonical/table/Dataset if present, else derived/visualization/Map
        @visualization = Carto::VisualizationQueryBuilder.new
                                                         .with_id_or_name(@id)
                                                         .build
                                                         .all
                                                         .sort { |vis_a, vis_b|
                                                              vis_a.type == Carto::Visualization::TYPE_CANONICAL ? -1 : 1
                                                            }
                                                         .first

        return render(text: 'Visualization does not exist', status: 404) if @visualization.nil?
        return render(text: 'Visualization not viewable', status: 403) if !@visualization.is_viewable_by_user?(current_viewer)
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
        VisualizationPresenter.new(visualization, current_viewer).to_poro
      end

    end
  end
end
