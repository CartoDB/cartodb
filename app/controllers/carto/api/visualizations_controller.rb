require_relative 'visualization_presenter'
require_dependency 'carto/api/vizjson_presenter'
require_relative '../../../models/visualization/stats'
require_relative 'paged_searcher'
require_relative '../controller_helper'
require_dependency 'carto/uuidhelper'
require_dependency 'static_maps_url_helper'
require_relative 'vizjson3_presenter'
require_dependency 'visualization/name_generator'
require_dependency 'visualization/table_blender'
require_dependency 'carto/visualization_migrator'
require_dependency 'carto/google_maps_api'
require_dependency 'carto/ghost_tables_manager'

module Carto
  module Api
    class VisualizationsController < ::Api::ApplicationController
      include VisualizationSearcher
      include PagedSearcher
      include Carto::UUIDHelper
      include VisualizationsControllerHelper
      include Carto::VisualizationMigrator

      ssl_required :index, :show, :create, :update, :destroy, :google_maps_static_image
      ssl_allowed  :vizjson2, :vizjson3, :list_watching, :static_map,
        :notify_watching, :list_watching, :add_like, :remove_like

      # TODO: compare with older, there seems to be more optional authentication endpoints
      skip_before_filter :api_authorization_required, only: [:show, :index, :vizjson2, :vizjson3, :add_like,
                                                             :remove_like, :notify_watching, :list_watching,
                                                             :static_map, :show]

      # :update and :destroy are correctly handled by permission check on the model
      before_filter :ensure_user_can_create, only: [:create]

      before_filter :optional_api_authorization, only: [:show, :index, :vizjson2, :vizjson3, :add_like,
                                                        :remove_like, :notify_watching, :list_watching, :static_map]

      before_filter :id_and_schema_from_params

      before_filter :load_visualization, only: [:add_like, :remove_like, :show,
                                                :list_watching, :notify_watching, :static_map, :vizjson2, :vizjson3,
                                                :update, :destroy, :google_maps_static_image]

      before_filter :ensure_username_matches_visualization_owner, only: [:show, :static_map, :vizjson2, :vizjson3,
                                                                         :list_watching, :notify_watching, :update,
                                                                         :destroy, :google_maps_static_image]

      before_filter :ensure_visualization_owned, only: [:destroy, :google_maps_static_image]
      before_filter :ensure_visualization_is_likeable, only: [:add_like, :remove_like]
      before_filter :link_ghost_tables, only: [:index]
      before_filter :load_common_data, only: [:index]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error
      rescue_from Carto::UUIDParameterFormatError, with: :rescue_from_carto_error
      rescue_from Carto::ProtectedVisualizationLoadError, with: :rescue_from_protected_visualization_load_error

      VALID_ORDER_PARAMS = %i(name updated_at size mapviews favorited estimated_row_count privacy
                              dependent_visualizations).freeze

      def show
        presenter = VisualizationPresenter.new(
          @visualization, current_viewer, self,
          related_canonical_visualizations: params[:fetch_related_canonical_visualizations] == 'true',
          show_user: params[:fetch_user] == 'true',
          show_user_basemaps: params[:show_user_basemaps] == 'true',
          show_liked: params[:show_liked] == 'true',
          show_permission: params[:show_permission] == 'true',
          show_stats: params[:show_stats] == 'true',
          show_auth_tokens: params[:show_auth_tokens] == 'true',
          password: params[:password],
          with_dependent_visualizations: params[:with_dependent_visualizations].to_i || 0
        )

        render_jsonp(::JSON.dump(presenter.to_poro))
      rescue StandardError => e
        log_error(exception: e)
        head(404)
      end

      def index
        offdatabase_orders = Carto::VisualizationQueryOrderer::SUPPORTED_OFFDATABASE_ORDERS.map(&:to_sym)
        valid_order_combinations = VALID_ORDER_PARAMS - offdatabase_orders
        opts = { valid_order_combinations: valid_order_combinations }
        page, per_page, order, order_direction = page_per_page_order_params(VALID_ORDER_PARAMS, opts)
        types = get_types_parameters

        vqb = query_builder_with_filter_from_hash(params)

        presenter_cache = Carto::Api::PresenterCache.new
        presenter_options = presenter_options_from_hash(params).merge(related: false)

        visualizations = vqb.with_order(order, order_direction)
                            .build_paged(page, per_page).map do |v|
          VisualizationPresenter.new(v, current_viewer, self, presenter_options)
                                .with_presenter_cache(presenter_cache).to_poro
        end.compact

        response = { visualizations: visualizations, total_entries: vqb.count }
        response.merge!(calculate_totals(types)) if current_user && params[:load_totals].to_s != 'false'
        response.merge!(calculate_do_totals(vqb, types)) if params[:load_do_totals].to_s == 'true'

        render_jsonp(response)
      rescue CartoDB::BoundingBoxError => e
        render_jsonp({ error: e.message }, 400)
      rescue Carto::ParamInvalidError, Carto::ParamCombinationInvalidError => e
        render_jsonp({ error: e.message }, e.status)
      rescue StandardError => e
        log_error(exception: e)
        render_jsonp({ error: e.message }, 500)
      end

      def add_like
        @visualization.add_like_from(current_viewer)
        render_jsonp(
          id: @visualization.id,
          liked: @visualization.liked_by?(current_viewer)
        )
      rescue Carto::Visualization::UnauthorizedLikeError
        render_jsonp({ text: "You don't have enough permissions to favorite this visualization" }, 403)
      rescue Carto::Visualization::AlreadyLikedError
        render_jsonp({ text: "You've already favorited this visualization" }, 400)
      end

      def remove_like
        @visualization.remove_like_from(current_viewer)
        render_jsonp(id: @visualization.id, liked: @visualization.liked_by?(current_viewer))
      rescue Carto::Visualization::UnauthorizedLikeError
        render_jsonp({ text: "You don't have enough permissions to favorite this visualization" }, 403)
      end

      def notify_watching
        return(head 403) unless @visualization.has_read_permission?(current_viewer)

        watcher = Carto::Visualization::Watcher.new(current_user, @visualization)
        watcher.notify

        render_jsonp(watcher.list)
      end

      def list_watching
        return(head 403) unless @visualization.has_read_permission?(current_viewer)

        render_jsonp(Carto::Visualization::Watcher.new(current_user, @visualization).list)
      end

      def vizjson2
        @visualization.mark_as_vizjson2 unless carto_referer?
        render_vizjson(generate_vizjson2)
      end

      def vizjson3
        render_vizjson(generate_vizjson3(@visualization))
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

      def create
        vis_data = payload

        vis_data.delete(:permission)
        vis_data.delete(:permission_id)

        param_tables = vis_data.delete(:tables)
        current_user_id = current_user.id

        origin = 'blank'
        source_id = vis_data.delete(:source_visualization_id)
        valid_attributes = vis_data.slice(*VALID_CREATE_ATTRIBUTES)
        vis = if source_id
                user = Carto::User.find(current_user_id)
                source = Carto::Visualization.where(id: source_id).first
                return head(403) unless source && source.is_viewable_by_user?(user) && !source.kind_raster?
                if source.derived?
                  origin = 'copy'
                  duplicate_derived_visualization(source_id, user)
                else
                  create_visualization_from_tables([source.user_table], valid_attributes)
                end
              elsif param_tables
                subdomain = CartoDB.extract_subdomain(request)
                viewed_user = Carto::User.where(username: subdomain).first
                tables = param_tables.map do |table_name|
                  Carto::Helpers::TableLocator.new.get_by_id_or_name(table_name, viewed_user) if viewed_user
                end
                create_visualization_from_tables(tables.flatten, valid_attributes)
              else
                Carto::Visualization.new(valid_attributes.merge(name: name_candidate, user_id: current_user_id))
              end

        vis.ensure_valid_privacy

        vis.save!

        current_viewer_id = current_viewer.id
        properties = {
          user_id: current_viewer_id,
          origin: origin,
          visualization_id: vis.id
        }

        if vis.derived?
          Carto::Tracking::Events::CreatedMap.new(current_viewer_id, properties).report
        else
          Carto::Tracking::Events::CreatedDataset.new(current_viewer_id, properties).report
        end

        render_jsonp(Carto::Api::VisualizationPresenter.new(vis, current_viewer, self).to_poro)
      rescue StandardError => e
        log_error(message: "Error creating visualization", exception: e)
        raise e if e.is_a?(Carto::UnauthorizedError)
        render_jsonp({ errors: vis.try(:errors).try(:full_messages) }, 400)
      end

      def update
        vis = @visualization

        return head(403) unless payload[:id] == vis.id
        return head(403) unless vis.has_permission?(current_user, Carto::Permission::ACCESS_READWRITE)

        vis_data = payload

        vis_data.delete(:permission) || vis_data.delete('permission')
        vis_data.delete(:permission_id) || vis_data.delete('permission_id')

        vis.transition_options = params[:transition_options] if params[:transition_options]

        # when a table gets renamed, its canonical visualization is renamed, so we must revert renaming if that failed
        # This is far from perfect, but works without messing with table-vis sync and their two backends
        valid_attributes = vis_data.slice(*VALID_UPDATE_ATTRIBUTES)
        if vis.table?
          old_vis_name = vis.name

          vis.attributes = valid_attributes
          new_vis_name = vis.name
          old_table_name = vis.table.name
          vis.save!
          if new_vis_name != old_vis_name && vis.table.name == old_table_name
            vis.name = old_vis_name
            vis.save!
          end
        else
          old_version = vis.version

          vis.attributes = valid_attributes
          vis.save!

          if version_needs_migration?(old_version, vis.version)
            migrate_visualization_to_v3(vis)
          end
        end

        render_jsonp(Carto::Api::VisualizationPresenter.new(vis, current_viewer, self).to_poro)
      rescue StandardError => e
        log_error(message: "Error updating visualization", exception: e)
        error_code = vis.errors.include?(:privacy) ? 403 : 400
        render_jsonp({ errors: vis.errors.full_messages.empty? ? ['Error updating'] : vis.errors.full_messages },
                     error_code)
      end

      def destroy
        return head(403) unless @visualization.has_permission?(current_viewer, Carto::Permission::ACCESS_READWRITE)

        current_viewer_id = current_viewer.id
        properties = { user_id: current_viewer_id, visualization_id: @visualization.id }

        # Tracking. Can this be moved to the model?
        if @visualization.derived?
          Carto::Tracking::Events::DeletedMap.new(current_viewer_id, properties).report
        else
          Carto::Tracking::Events::DeletedDataset.new(current_viewer_id, properties).report
        end

        if @visualization.table
          @visualization.table.fully_dependent_visualizations.each do |dependent_vis|
            properties = { user_id: current_viewer_id, visualization_id: dependent_vis.id }
            if dependent_vis.derived?
              Carto::Tracking::Events::DeletedMap.new(current_viewer_id, properties).report
            else
              Carto::Tracking::Events::DeletedDataset.new(current_viewer_id, properties).report
            end
          end
        end

        @visualization.destroy

        head 204
      rescue StandardError => exception
        log_error(message: 'Error deleting visualization', exception: exception)
        render_jsonp({ errors: [exception.message] }, 400)
      end

      def google_maps_static_image
        gmaps_api = Carto::GoogleMapsApi.new
        base_layer_options = @visualization.base_layers.first.options
        base_url = gmaps_api.build_static_image_url(
          center: params[:center],
          map_type: base_layer_options[:baseType],
          size: params[:size],
          zoom: params[:zoom],
          style: JSON.parse(base_layer_options[:style], symbolize_names: true)
        )

        render(json: { url: gmaps_api.sign_url(@visualization.user, base_url) })
      rescue StandardError => e
        log_error(message: 'Error generating Google API URL', exception: e)
        render(json: { errors: 'Error generating static image URL' }, status: 400)
      end

      private

      # excluded:
      #   :id, :map_id, :type, :created_at, :external_source, :url, :version, :table, :user_id
      #   :synchronization, :uses_builder_features, :auth_tokens, :transition_options, :prev_id, :next_id, :parent_id
      #   :active_child, :permission
      VALID_UPDATE_ATTRIBUTES = [:name, :display_name, :active_layer_id, :tags, :description, :privacy, :updated_at,
                                 :locked, :source, :title, :license, :attributions, :kind, :password, :version].freeze
      # TODO: This lets more things through than it should. This is due to tests using this endpoint to create
      #       test visualizations.
      VALID_CREATE_ATTRIBUTES = (VALID_UPDATE_ATTRIBUTES + [:type, :map_id] - [:version]).freeze

      def generate_vizjson2
        Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).to_vizjson(https_request: is_https?)
      end

      def render_vizjson(vizjson)
        set_vizjson_response_headers_for(@visualization)
        render_jsonp(vizjson)
      rescue StandardError => exception
        CartoDB.notify_exception(exception)
        raise exception
      end

      def load_visualization
        @visualization = load_visualization_from_id_or_name(params[:id])

        if @visualization.nil?
          raise Carto::LoadError.new('Visualization does not exist', 404)
        end

        if !@visualization.is_accessible_with_password?(current_viewer, params[:password])
          if @visualization.password_protected?
            raise Carto::ProtectedVisualizationLoadError.new(@visualization)
          else
            raise Carto::LoadError.new('Visualization not viewable', 403)
          end
        end
      end

      def ensure_username_matches_visualization_owner
        unless request_username_matches_visualization_owner
          raise Carto::LoadError.new('Visualization of that user does not exist', 404)
        end
      end

      def ensure_visualization_owned
        raise Carto::LoadError.new('Visualization not editable', 403) unless @visualization.is_owner?(current_viewer)
      end

      def ensure_visualization_is_likeable
        return(head 403) unless current_viewer && @visualization.is_viewable_by_user?(current_viewer)
      end

      def ensure_user_can_create
        return (head 403) unless current_viewer && !current_viewer.viewer
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

      def carto_referer?
        referer_host = URI.parse(request.referer).host
        referer_host && (referer_host.ends_with?('carto.com') || referer_host.ends_with?('cartodb.com'))
      rescue URI::InvalidURIError
        false
      end

      def payload
        request.body.rewind
        ::JSON.parse(request.body.read.to_s || String.new, symbolize_names: true)
      end

      def duplicate_derived_visualization(source, user)
        export_service = Carto::VisualizationsExportService2.new
        visualization_hash = export_service.export_visualization_json_hash(source, user)
        visualization_copy = export_service.build_visualization_from_hash_export(visualization_hash)
        visualization_copy.name = name_candidate
        visualization_copy.version = user.new_visualizations_version
        Carto::VisualizationsExportPersistenceService.new.save_import(user, visualization_copy)

        visualization_copy
      end

      def name_candidate
        CartoDB::Visualization::NameGenerator.new(current_user).name(params[:name])
      end

      def create_visualization_from_tables(tables, vis_data)
        blender = CartoDB::Visualization::TableBlender.new(Carto::User.find(current_user.id), tables)
        map = blender.blend

        Carto::Visualization.new(vis_data.merge(name: name_candidate,
                                                map_id: map.id,
                                                type: 'derived',
                                                privacy: blender.blended_privacy,
                                                user_id: current_user.id,
                                                overlays: Carto::OverlayFactory.build_default_overlays(current_user)))
      end

      def link_ghost_tables
        return unless current_user && current_user.has_feature_flag?('ghost_tables')

        # This call will trigger ghost tables synchronously if there's risk of displaying a stale table
        # or asynchronously otherwise.
        Carto::GhostTablesManager.new(current_user.id).link_ghost_tables
      end

      def load_common_data
        return true unless current_user.present?
        begin
          visualizations_api_url = CartoDB::Visualization::CommonDataService.build_url(self)
          ::Resque.enqueue(::Resque::UserDBJobs::CommonData::LoadCommonData, current_user.id, visualizations_api_url) if current_user.should_load_common_data?
        rescue Exception => e
          # We don't block the load of the dashboard because we aren't able to load common dat
          CartoDB.notify_exception(e, {user:current_user})
          return true
        end
      end

      def calculate_totals(total_types)
        # Prefetching at counts removes duplicates
        {
          total_user_entries: VisualizationQueryBuilder.new
                                                       .with_types(total_types)
                                                       .with_user_id(current_user.id)
                                                       .count,
          total_locked: VisualizationQueryBuilder.new
                                                 .with_types(total_types)
                                                 .with_user_id(current_user.id)
                                                 .with_locked(true)
                                                 .count,
          total_likes: VisualizationQueryBuilder.new
                                                .with_types(total_types)
                                                .with_liked_by_user_id(current_user.id)
                                                .with_locked(false)
                                                .count,
          total_shared: VisualizationQueryBuilder.new
                                                 .with_types(total_types)
                                                 .with_shared_with_user_id(current_user.id)
                                                 .with_user_id_not(current_user.id)
                                                 .with_locked(false)
                                                 .count
        }
      end

      def calculate_do_totals(vqb, total_types)
        subscription_count = if params[:subscribed] == 'true'
                               vqb.count
                             else
                               do_total_filtered_query(total_types).find_each.lazy
                                                                   .count { |v| v.subscription.present? }
                             end

        sample_count = if params[:sample] == 'true'
                         vqb.count
                       else
                         do_total_filtered_query(total_types).find_each.lazy
                                                             .count { |v| v.sample.present? }
                       end

        { total_subscriptions: subscription_count, total_samples: sample_count }
      end

      def do_total_filtered_query(total_types)
        VisualizationQueryBuilder.new
                                 .with_types(total_types)
                                 .with_user_id(current_user.id)
                                 .filtered_query
                                 .includes(map: { user_table: :data_import })
      end

      def log_context
        @visualization.present? ? super.merge(visualization: @visualization&.attributes&.slice(:id)) : super
      end
    end
  end
end
