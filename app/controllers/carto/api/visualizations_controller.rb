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

module Carto
  module Api
    class VisualizationsController < ::Api::ApplicationController
      include VisualizationSearcher
      include PagedSearcher
      include Carto::UUIDHelper
      include Carto::ControllerHelper
      include VisualizationsControllerHelper
      include Carto::VisualizationMigrator

      ssl_required :index, :show, :create, :destroy
      ssl_allowed  :vizjson2, :vizjson3, :likes_count, :likes_list, :is_liked, :list_watching, :static_map

      # TODO: compare with older, there seems to be more optional authentication endpoints
      skip_before_filter :api_authorization_required, only: [:index, :vizjson2, :vizjson3, :is_liked, :static_map]
      before_filter :optional_api_authorization, only: [:index, :vizjson2, :vizjson3, :is_liked, :static_map]

      before_filter :id_and_schema_from_params
      before_filter :load_visualization, only: [:likes_count, :likes_list, :is_liked, :show, :stats, :list_watching,
                                                :static_map, :vizjson2, :vizjson3, :update, :destroy]
      before_filter :ensure_visualization_owned, only: [:destroy]

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
        presenter_options = presenter_options_from_hash(params).merge(related: false)

        # TODO: undesirable table hardcoding, needed for disambiguation. Look for
        # a better approach and/or move it to the query builder
        response = {
          visualizations: vqb.with_order("visualizations.#{order}", :desc).build_paged(page, per_page).map { |v|
              VisualizationPresenter.new(v, current_viewer, self, presenter_options)
                                    .with_presenter_cache(presenter_cache).to_poro
          },
          total_entries: vqb.build.count
        }
        if current_user && (params[:load_totals].to_s != 'false')
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
          liked: current_viewer ? @visualization.liked_by?(current_viewer.id) : false
        })
      end

      def vizjson2
        @visualization.mark_as_vizjson2 unless carto_referer?
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

      def create
        vis_data = payload

        vis_data.delete(:permission)
        vis_data.delete(:permission_id)

        # Don't allow to modify next_id/prev_id, force to use set_next_id()
        prev_id = vis_data.delete(:prev_id) || vis_data.delete('prev_id')
        next_id = vis_data.delete(:next_id) || vis_data.delete('next_id')

        param_tables = vis_data.delete(:tables)
        current_user_id = current_user.id

        origin = 'blank'
        source_id = vis_data.delete(:source_visualization_id)
        vis = if source_id
                user = Carto::User.find(current_user_id)
                source = Carto::Visualization.where(id: source_id).first
                return head(403) unless source && source.is_viewable_by_user?(user) && !source.kind_raster?
                if source.derived?
                  origin = 'copy'
                  duplicate_derived_visualization(source_id, user)
                else
                  create_visualization_from_tables([source.user_table], vis_data)
                end
              elsif param_tables
                subdomain = CartoDB.extract_subdomain(request)
                viewed_user = ::User.find(username: subdomain)
                tables = param_tables.map do |table_name|
                  Carto::Helpers::TableLocator.new.get_by_id_or_name(table_name, viewed_user) if viewed_user
                end
                create_visualization_from_tables(tables.flatten, vis_data)
              else
                Carto::Visualization.new(vis_data.merge(name: name_candidate, user_id: current_user_id))
              end

        vis.ensure_valid_privacy
        # both null, make sure is the first children or automatically link to the tail of the list
        if !vis.parent_id.nil? && prev_id.nil? && next_id.nil?
          parent_vis = Carto::Visualization.find(vis.parent_id)
          return head(403) unless parent_vis.has_permission?(current_user, Carto::Permission::ACCESS_READWRITE)

          children = parent_vis.children

          prev_id = children.last.id unless children.empty?
        end


        vis.store

        vis = set_visualization_prev_next(vis, prev_id, next_id)

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
      rescue => e
        CartoDB::Logger.error(message: "Error creating visualization", visualization_id: vis.id, exception: e)
        render_jsonp({ errors: vis.full_errors }, 400)
      end

      def update
        begin
          vis = @visualization

          return head(404) unless vis
          return head(403) unless payload[:id] == vis.id
          return head(403) unless vis.has_permission?(current_user, Carto::Permission::ACCESS_READWRITE)

          vis_data = payload

          vis_data.delete(:permission) || vis_data.delete('permission')
          vis_data.delete(:permission_id)  || vis_data.delete('permission_id')

          # Don't allow to modify next_id/prev_id, force to use set_next_id()
          vis_data.delete(:prev_id) || vis_data.delete('prev_id')
          vis_data.delete(:next_id) || vis_data.delete('next_id')
          # when a table gets renamed, first it's canonical visualization is renamed, so we must revert renaming if that failed
          # This is far from perfect, but works without messing with table-vis sync and their two backends

          if vis.table?
            old_vis_name = vis.name

            vis.attributes = vis_data
            new_vis_name = vis.name
            old_table_name = vis.table.name
            vis.store
            if new_vis_name != old_vis_name && vis.table.name == old_table_name
              vis.name = old_vis_name
              vis.store
            else
              vis
            end
          else
            old_version = vis.version

            vis.attributes = vis_data
            vis.store

            if version_needs_migration?(old_version, vis.version)
              migrate_visualization_to_v3(vis)
            end
          end

          # TODO: sometimes an attribute changes. Example: visualization name because of sanitization.
          # Avoid this reload by updating the entity properly.
          vis.reload

          render_jsonp(Carto::Api::VisualizationPresenter.new(vis, current_viewer, self).to_poro)
        rescue KeyError => e
          CartoDB::Logger.error(message: "KeyError updating visualization", visualization_id: vis.id, exception: e)
          head(404)
        rescue => e
          CartoDB::Logger.error(message: "Error updating visualization", visualization_id: vis.id, exception: e)
          render_jsonp({ errors: vis.full_errors.empty? ? ['Error saving data'] : vis.full_errors }, 400)
        end
      end

      def destroy
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
      rescue => exception
        CartoDB::Logger.error(message: 'Error deleting visualization', exception: exception,
                              visualization: @visualization)
        render_jsonp({ errors: [exception.message] }, 400)
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
      rescue => exception
        CartoDB.notify_exception(exception)
        raise exception
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

      def ensure_visualization_owned
        raise Carto::LoadError.new('Visualization not editable', 403) unless @visualization.is_owner?(current_viewer)
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

      def carto_referer?
        referer_host = URI.parse(request.referer).host
        referer_host && (referer_host.ends_with?('carto.com') || referer_host.ends_with?('cartodb.com'))
      rescue URI::InvalidURIError
        false
      end

      def payload
        request.body.rewind
        ::JSON.parse(request.body.read.to_s || String.new, {symbolize_names: true})
      end

      def duplicate_derived_visualization(source, user)
        export_service = Carto::VisualizationsExportService2.new
        visualization_hash = export_service.export_visualization_json_hash(source, user)
        visualization_copy = export_service.build_visualization_from_hash_export(visualization_hash)
        visualization_copy.name = name_candidate
        visualization_copy.version = user.new_visualizations_version
        Carto::VisualizationsExportPersistenceService.new.save_import(user, visualization_copy)

        Carto::Visualization.find(visualization_copy.id)
      end

      def name_candidate
        CartoDB::Visualization::NameGenerator.new(current_user).name(params[:name])
      end

      def set_visualization_prev_next(vis, prev_id, next_id)
        if !prev_id.nil?
          prev_vis = Carto::Visualization.find(prev_id)
          return head(403) unless prev_vis.has_permission?(current_user, Carto::Permission::ACCESS_READWRITE)
          prev_vis.set_next_list_item!(vis)
        elsif !next_id.nil?
          next_vis = Carto::Visualization.find(next_id)
          return head(403) unless next_vis.has_permission?(current_user, Carto::Permission::ACCESS_READWRITE)
          next_vis.set_prev_list_item!(vis)
        end
        vis
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
    end
  end
end
