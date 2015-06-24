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

  ssl_allowed  :notify_watching, :list_watching, :add_like, :remove_like
  ssl_required :create, :update, :destroy, :set_next_id unless Rails.env.development? || Rails.env.test?
  skip_before_filter :api_authorization_required, only: [:add_like, :remove_like]
  before_filter :optional_api_authorization, only: [:add_like, :remove_like]
  before_filter :table_and_schema_from_params, only: [:update, :destroy, :stats,
                                                      :notify_watching, :list_watching,
                                                      :add_like, :remove_like, :set_next_id]

  def create
    vis_data = payload

    vis_data.delete(:permission)
    vis_data.delete(:permission_id)

    # Don't allow to modify next_id/prev_id, force to use set_next_id()
    prev_id = vis_data.delete(:prev_id) || vis_data.delete('prev_id')
    next_id = vis_data.delete(:next_id) || vis_data.delete('next_id')
    vis = nil

    if params[:source_visualization_id]
      source,  = locator.get(params.fetch(:source_visualization_id), CartoDB.extract_subdomain(request))
      return(head 403) if source.nil? || source.kind == Visualization::Member::KIND_RASTER

      copy_overlays = params.fetch(:copy_overlays, true)
      copy_layers = params.fetch(:copy_layers, true)

      additional_fields = {
        type:       params.fetch(:type, Visualization::Member::TYPE_DERIVED),
        parent_id:  params.fetch(:parent_id, nil)
      }

      vis = Visualization::Copier.new(
        current_user, source, name_candidate
      ).copy(copy_overlays, copy_layers, additional_fields)

    elsif params[:tables]
      viewed_user = User.find(:username => CartoDB.extract_subdomain(request))
      tables = params[:tables].map { |table_name|
        if viewed_user
          Helpers::TableLocator.new.get_by_id_or_name(table_name,  viewed_user)
        end
      }.flatten
      blender = Visualization::TableBlender.new(current_user, tables)
      map = blender.blend
      vis = Visualization::Member.new(
        vis_data.merge(
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
        add_default_privacy(vis_data).merge(
          name: name_candidate,
          user_id:  current_user.id
        )
      )
    end

    vis.privacy = vis.default_privacy(current_user)

    # both null, make sure is the first children or automatically link to the tail of the list
    if !vis.parent_id.nil? && prev_id.nil? && next_id.nil?
      parent_vis = Visualization::Member.new(id: vis.parent_id).fetch
      return head(403) unless parent_vis.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

      if parent_vis.children.length > 0
        prev_id = parent_vis.children.last.id
      end
    end

    vis.store

    # Setup prev/next
    if !prev_id.nil?
      prev_vis = Visualization::Member.new(id: prev_id).fetch
      return head(403) unless prev_vis.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

      prev_vis.set_next_list_item!(vis)
    elsif !next_id.nil?
      next_vis = Visualization::Member.new(id: next_id).fetch
      return head(403) unless next_vis.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

      next_vis.set_prev_list_item!(vis)
    end

    render_jsonp(vis)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: vis.full_errors }, 400)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    CartoDB.notify_exception(exception, { user: current_user, template_data: exception.template_data })
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  end

  def update
    vis,  = locator.get(@table_id, CartoDB.extract_subdomain(request))
    return(head 404) unless vis
    return head(403) unless vis.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

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

      vis_data.delete(:url_options) if vis_data[:url_options].present?
      vis.attributes = vis_data
      new_vis_name = vis.name
      old_table_name = vis.table.name
      vis.store.fetch
      if new_vis_name != old_vis_name && vis.table.name == old_table_name
        vis.name = old_vis_name
        vis.store.fetch
      end
    else
      vis.attributes = vis_data
      vis.store.fetch
    end

    render_jsonp(vis)
  rescue KeyError
    head(404)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: vis.full_errors.empty? ? ['Error saving data'] : vis.full_errors }, 400)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    CartoDB.notify_exception(exception, { user: current_user, template_data: exception.template_data })
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  rescue => e
    render_jsonp({ errors: ['Unknown error'] }, 400)
  end

  def destroy
    vis,  = locator.get(@table_id, CartoDB.extract_subdomain(request))
    return(head 404) unless vis
    return(head 403) unless vis.is_owner?(current_user)
    vis.delete
    return head 204
  rescue KeyError
    head(404)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    CartoDB.notify_exception(exception, { user: current_user, template_data: exception.template_data })
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
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

  def set_next_id
    next_id = payload[:next_id] || payload['next_id']

    prev_vis = Visualization::Member.new(id: @table_id).fetch
    return(head 403) unless prev_vis.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

    if next_id.nil?
      last_children = prev_vis.parent.children.last
      last_children.set_next_list_item!(prev_vis)

      render_jsonp(last_children.to_vizjson({https_request: request.protocol == 'https://'}))
    else
      next_vis = Visualization::Member.new(id: next_id).fetch
      return(head 403) unless next_vis.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

      prev_vis.set_next_list_item!(next_vis)

      render_jsonp(prev_vis.to_vizjson({https_request: request.protocol == 'https://'}))
    end
  rescue KeyError
    head(404)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: ['Error saving next slide position'] }, 400)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    CartoDB.notify_exception(exception, { user: current_user, template_data: exception.template_data })
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  rescue
    render_jsonp({ errors: ['Unknown error'] }, 400)
  end

  def add_like
    return(head 403) unless current_viewer

    vis = Visualization::Member.new(id: @table_id).fetch
    raise KeyError if !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY) &&
      vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK

    vis.add_like_from(current_viewer.id)
       .fetch
       .invalidate_cache
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

  def remove_like
    return(head 403) unless current_viewer

    vis = Visualization::Member.new(id: @table_id).fetch
    raise KeyError if !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY) &&
      vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK

    vis.remove_like_from(current_viewer.id)
       .fetch
       .invalidate_cache

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

  def allow_vizjson_v2_for?(visualization)
    return false unless visualization
    (current_user && visualization.user_id == current_user.id) ||
      (current_viewer && visualization.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY)) ||
      (visualization.public? || visualization.public_with_link?)
  end

  def current_user_is_owner?(table)
    current_user.present? && (table.owner.id == current_user.id)
  end

  def set_vizjson_response_headers_for(visualization)
    # We don't cache non-public vis
    if visualization.public? || visualization.public_with_link?
      response.headers['X-Cache-Channel'] = "#{visualization.varnish_key}:vizjson"
      response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_VIZJSON} #{visualization.surrogate_key}"
      response.headers['Cache-Control']   = 'no-cache,max-age=86400,must-revalidate, public'
    end
  end

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new, {symbolize_names: true})
  end

  def add_default_privacy(data)
    { privacy: default_privacy }.merge(data)
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
      # TODO this should never be done
      Sequel::Model.db.fetch(
        'SELECT * FROM synchronizations WHERE user_id = ? AND name IN ?',
        current_user.id,
        table_data.map{ |table|
          table[:name]
        }
      ).all.map { |s| [s[:name], s] }
    ]
  end

  def prepare_params_for_total_count(params)
    # TODO: refactor for making default parameters and total counting obvious
    if params[:type].nil? || params[:type] == ''
      types = params.fetch('types', '').split(',')
      type = types.include?(Visualization::Member::TYPE_DERIVED) ? Visualization::Member::TYPE_DERIVED : Visualization::Member::TYPE_CANONICAL 
      params.merge( { type: type } )
    else
      params[:type] == Visualization::Member::TYPE_REMOTE ? params.merge( { type: Visualization::Member::TYPE_CANONICAL } ) : params
    end
  end

  # Need to always send request object to visualizations upon rendering their json
  def render_jsonp(obj, status = 200, options = {})
    super(obj, status, options.merge({request: request}))
  end

end

