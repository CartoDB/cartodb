# encoding: utf-8
require 'json'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/collection'
require_relative '../../../models/visualization/presenter'
require_relative '../../../models/visualization/locator'
require_relative '../../../models/visualization/copier'
require_relative '../../../models/visualization/name_generator'
require_relative '../../../models/visualization/table_blender'
require_relative '../../../models/visualization/watcher'
require_relative '../../../models/map/presenter'
require_relative '../../../../services/named-maps-api-wrapper/lib/named-maps-wrapper/exceptions'

class Api::Json::VisualizationsController < Api::ApplicationController
  include CartoDB

  ssl_allowed  :vizjson1, :vizjson2, :notify_watching, :list_watching, :likes_count, :likes_list, :add_like, :is_liked,
               :remove_like
  ssl_required :index, :show, :create, :update, :destroy
  skip_before_filter :api_authorization_required, only: [:vizjson1, :vizjson2, :likes_count, :likes_list, :add_like,
                                                         :is_liked, :remove_like, :index]
  before_filter :optional_api_authorization, only: [:likes_count, :likes_list, :add_like, :is_liked, :remove_like,
                                                    :index]
  before_filter :link_ghost_tables, only: [:index, :show]
  before_filter :table_and_schema_from_params, only: [:show, :update, :destroy, :stats, :vizjson1, :vizjson2,
                                                      :notify_watching, :list_watching, :likes_count, :likes_list,
                                                      :add_like, :is_liked, :remove_like]

  def index
    current_user ? index_logged_in : index_not_logged_in
  end

  def create
    payload.delete(:permission) if payload[:permission].present?
    payload.delete[:permission_id] if payload[:permission_id].present?
    vis = nil

    if params[:source_visualization_id]
      source = Visualization::Collection.new.fetch(
        id: params.fetch(:source_visualization_id),
        user_id: current_user.id,
        exclude_raster: true
      ).first
      return(head 403) if source.nil?

      vis = Visualization::Copier.new(
        current_user, source, name_candidate
      ).copy
    elsif params[:tables]
      viewed_user = User.find(:username => CartoDB.extract_subdomain(request))
      tables = params[:tables].map { |table_name|
        if viewed_user
          ::Table.get_by_id_or_name(table_name,  viewed_user)
        end
      }.flatten
      blender = Visualization::TableBlender.new(current_user, tables)
      map = blender.blend
      vis = Visualization::Member.new(
        payload.merge(
          name:     name_candidate,
          map_id:   map.id,
          type:     'derived',
          privacy:  blender.blended_privacy,
          user_id:  current_user.id
        )
      )

      # create default overlays
      Visualization::Overlays.new(vis).create_default_overlays
    else
      vis = Visualization::Member.new(
        payload_with_default_privacy.merge(
          name: name_candidate,
          user_id:  current_user.id
        )
      )
    end

    vis.privacy = vis.default_privacy(current_user)

    vis.store
    current_user.update_visualization_metrics
    render_jsonp(vis)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: vis.full_errors }, 400)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  end

  def show
    vis = Visualization::Member.new(id: @table_id).fetch
    return(head 403) unless vis.has_permission?(current_user, Visualization::Member::PERMISSION_READONLY)
    render_jsonp(vis)
  rescue KeyError
    head(404)
  end
  
  def update
    vis = Visualization::Member.new(id: @table_id).fetch
    return head(403) unless vis.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

    payload.delete(:permission) if payload[:permission].present?
    payload.delete[:permission_id] if payload[:permission_id].present?

    # when a table gets renamed, first it's canonical visualization is renamed, so we must revert renaming if that failed
    # This is far from perfect, but works without messing with table-vis sync and their two backends
    if vis.table?
      old_vis_name = vis.name

      payload.delete(:url_options) if payload[:url_options].present?
      vis.attributes = payload
      new_vis_name = vis.name
      old_table_name = vis.table.name
      vis.store.fetch
      if new_vis_name != old_vis_name && vis.table.name == old_table_name
        vis.name = old_vis_name
        vis.store.fetch
      end
    else
      vis.attributes = payload  
      vis.store.fetch
    end

    render_jsonp(vis)
  rescue KeyError
    head(404)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: vis.full_errors.empty? ? ['Error saving data'] : vis.full_errors }, 400)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  rescue
    render_jsonp({ errors: ['Unknown error'] }, 400)
  end

  def destroy
    vis = Visualization::Member.new(id: @table_id).fetch
    return(head 403) unless vis.is_owner?(current_user)
    vis.delete
    current_user.update_visualization_metrics
    return head 204
  rescue KeyError
    head(404)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  end

  def stats
    vis = Visualization::Member.new(id: @table_id).fetch
    return(head 401) unless vis.has_permission?(current_user, Visualization::Member::PERMISSION_READONLY)
    render_jsonp(vis.stats)
  rescue KeyError
    head(404)
  end

  def vizjson1
    visualization,  = locator.get(@table_id, CartoDB.extract_subdomain(request))
    return(head 404) unless visualization
    return(head 403) unless allow_vizjson_v1_for?(visualization.table)
    set_vizjson_response_headers_for(visualization)
    render_jsonp(CartoDB::Map::Presenter.new(
      visualization.map, 
      { full: false, url: "/api/v1/tables/#{visualization.table.id}" },
      Cartodb.config, 
      CartoDB::Logger
    ).to_poro)
  rescue => exception
    CartoDB.notify_exception(exception)
    raise exception
  end

  def vizjson2
    visualization,  = locator.get(@table_id, CartoDB.extract_subdomain(request))
    return(head 404) unless visualization
    return(head 403) unless allow_vizjson_v2_for?(visualization)
    set_vizjson_response_headers_for(visualization)
    render_jsonp(visualization.to_vizjson)
  rescue KeyError => exception
    render(text: exception.message, status: 403)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    CartoDB.notify_exception(exception)
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

  def notify_watching
    vis = Visualization::Member.new(id: @table_id).fetch
    return(head 403) unless vis.has_permission?(current_user, Visualization::Member::PERMISSION_READONLY)
    watcher = CartoDB::Visualization::Watcher.new(current_user, vis)
    watcher.notify
    render_jsonp(watcher.list)
  end

  def list_watching
    vis = Visualization::Member.new(id: @table_id).fetch
    return(head 403) unless vis.has_permission?(current_user, Visualization::Member::PERMISSION_READONLY)
    watcher = CartoDB::Visualization::Watcher.new(current_user, vis)
    render_jsonp(watcher.list)
  end

  # Does not mandate a current_viewer except if vis is not public
  def likes_count
    vis = Visualization::Member.new(id: @table_id).fetch
    if vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK
      raise KeyError if current_viewer.nil? || !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY)
    end

    render_jsonp({
                   id: vis.id,
                   likes: vis.likes.count
                 })
  rescue KeyError => exception
    render(text: exception.message, status: 403)
  end

  # Does not mandate a current_viewer except if vis is not public
  def likes_list
    vis = Visualization::Member.new(id: @table_id).fetch
    if vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK
      raise KeyError if current_viewer.nil? || !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY)
    end

    render_jsonp({
                   id: vis.id,
                   likes: vis.likes.map { |like| {actor_id: like.actor } }
                 })
  rescue KeyError => exception
    render(text: exception.message, status: 403)
  end

  def add_like
    return(head 403) unless current_viewer

    vis = Visualization::Member.new(id: @table_id).fetch
    raise KeyError if !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY) &&
      vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK

    vis.add_like_from(current_viewer.id)
       .fetch
       .invalidate_varnish_cache
    render_jsonp({
                   id:    vis.id,
                   likes: vis.likes.count,
                   liked: vis.liked_by?(current_viewer.id)
                 })
  rescue KeyError => exception
    render(text: exception.message, status: 403)
  rescue AlreadyLikedError
    render(text: "You've already liked this visualization", status: 400)
  end

  def is_liked
    if current_viewer
      vis = Visualization::Member.new(id: @table_id).fetch
      raise KeyError if vis.privacy != Visualization::Member::PRIVACY_PUBLIC &&
                        vis.privacy != Visualization::Member::PRIVACY_LINK &&
                        !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY)
      render_jsonp({
                     id:    vis.id,
                     likes: vis.likes.count,
                     liked: vis.liked_by?(current_viewer.id)
                   })
    else
      vis = Visualization::Member.new(id: @table_id).fetch
      raise KeyError if vis.privacy != Visualization::Member::PRIVACY_PUBLIC &&
                        vis.privacy != Visualization::Member::PRIVACY_LINK
      render_jsonp({
                     id:    vis.id,
                     likes: vis.likes.count,
                     liked: false
                   })
    end
  rescue KeyError => exception
    render(text: exception.message, status: 403)
  end

  def remove_like
    return(head 403) unless current_viewer

    vis = Visualization::Member.new(id: @table_id).fetch
    raise KeyError if !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY) &&
      vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK

    vis.remove_like_from(current_viewer.id)
       .fetch
       .invalidate_varnish_cache

    render_jsonp({
                   id:    vis.id,
                   likes: vis.likes.count,
                   liked: false
                 })
  rescue KeyError => exception
    render(text: exception.message, status: 403)
  end

  private

  def table_and_schema_from_params
    if params.fetch('id', nil) =~ /\./
      @table_id, @schema = params.fetch('id').split('.').reverse
    else
      @table_id, @schema = [params.fetch('id', nil), nil]
    end
  end

  def locator
    CartoDB::Visualization::Locator.new
  end

  def scope_for(user)
    { user_id: user.id }
  end

  def allow_vizjson_v1_for?(table)
    table && (table.public? || table.public_with_link_only? || current_user_is_owner?(table))
  end #allow_vizjson_v1_for?

  def allow_vizjson_v2_for?(visualization)
    visualization && (visualization.public? || visualization.public_with_link?)
  end

  def current_user_is_owner?(table)
    current_user.present? && (table.owner.id == current_user.id)
  end

  def set_vizjson_response_headers_for(visualization)
    response.headers['X-Cache-Channel'] = "#{visualization.varnish_key}:vizjson"
    response.headers['Cache-Control']   = 'no-cache,max-age=86400,must-revalidate, public'
  end

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new, {symbolize_names: true})
  end

  def payload_with_default_privacy
    { privacy: default_privacy }.merge(payload)
  end

  def default_privacy
    current_user.private_tables_enabled ? Visualization::Member::PRIVACY_PRIVATE : Visualization::Member::PRIVACY_PUBLIC
  end

  def name_candidate
    Visualization::NameGenerator.new(current_user)
                                .name(params[:name])
  end

  def tables_by_map_id(map_ids)
    Hash[ ::Table.where(map_id: map_ids).map { |table| [table.map_id, table] } ]
  end

  def synchronizations_by_table_name(table_data)
    # TODO: Check for organization visualizations
    Hash[
      ::Table.db.fetch(
        'SELECT * FROM synchronizations WHERE user_id = ? AND name IN ?',
        current_user.id,
        table_data.map{ |table|
          table[:name]
        }
      ).all.map { |s| [s[:name], s] }
    ]
  end

  # This only allows to authenticate if sending an API request to username.api_key subdomain,
  # but doesn't breaks the request if can't authenticate
  def optional_api_authorization
    if params[:api_key].present?
      authenticate(:api_key, :api_authentication, :scope => CartoDB.extract_subdomain(request))
    end
  end

  def index_not_logged_in
    public_visualizations = []
    total_liked_entries = 0
    total_shared_entries = 0
    user = User.where(username: CartoDB.extract_subdomain(request)).first

    unless user.nil?
      filtered_params = params.dup.merge(scope_for(user))
      filtered_params[Visualization::Collection::FILTER_UNAUTHENTICATED] = true
      collection = Visualization::Collection.new.fetch(filtered_params)

      public_visualizations  = collection.map { |vis|
        begin
          vis.to_hash(
            public_fields_only: true,
            related: false,
            table: vis.table
          )
        rescue => exception
          puts exception.to_s + exception.backtrace.join("\n")
        end
      }.compact

      total_liked_entries = collection.total_liked_entries
      total_shared_entries = collection.total_shared_entries
    end

    response = {
      visualizations: public_visualizations,
      total_entries:  public_visualizations.length,
      total_likes:    total_liked_entries,
      total_shared:   total_shared_entries
    }
    render_jsonp(response)
  end

  def index_logged_in
    collection = Visualization::Collection.new.fetch(
      params.dup.merge(scope_for(current_user))
    )

    users_cache = {}

    table_data = collection.map { |vis|
      if vis.table.nil?
        nil
      else
        users_cache[vis.user_id] ||= vis.user
        {
          name:   vis.table.name,
          schema: users_cache[vis.user_id].database_schema
        }
      end
    }.compact
    synchronizations = synchronizations_by_table_name(table_data)
    representation  = collection.map { |vis|
      begin
        vis.to_hash(
          related:    false,
          table_data: !(params[:table_data] =~ /false/),
          user:       current_user,
          table:      vis.table,
          synchronization: synchronizations[vis.name]
        )
      rescue => exception
        puts exception.to_s + exception.backtrace.join("\n")
      end
    }.compact

    response = {
      visualizations: representation,
      total_entries:  collection.total_entries,
      total_likes:    collection.total_liked_entries,
      total_shared:   collection.total_shared_entries
    }
    current_user.update_visualization_metrics
    render_jsonp(response)
  end

end

