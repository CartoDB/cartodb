# encoding: utf-8
require 'json'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/collection'
require_relative '../../../models/visualization/presenter'
require_relative '../../../models/visualization/locator'
require_relative '../../../models/visualization/copier'
require_relative '../../../models/visualization/name_generator'
require_relative '../../../models/visualization/table_blender'
require_relative '../../../models/map/presenter'
require_relative '../../../../services/named-maps-api-wrapper/lib/named-maps-wrapper/exceptions'

class Api::Json::VisualizationsController < Api::ApplicationController
  include CartoDB
  
  ssl_allowed :vizjson1, :vizjson2
  ssl_required :index, :show, :create, :update, :destroy
  skip_before_filter :api_authorization_required, only: [:vizjson1, :vizjson2]
  before_filter :link_ghost_tables, only: [:index, :show]

  def index
    collection       = Visualization::Collection.new.fetch(
                         params.dup.merge(scope_for(current_user))
                       )
    table_data = collection.map { |member|
      if member.table.nil?
        nil
      else
        {
            name:   member.table.name,
            schema: member.user.database_schema
        }
      end
    }.compact
    synchronizations = synchronizations_by_table_name(table_data)
    rows_and_sizes   = rows_and_sizes_for(table_data)

    representation  = collection.map { |member|
      begin
        member.to_hash(
          related:    false,
          table_data: !(params[:table_data] =~ /false/),
          user:       current_user,
          table:      member.table,
          synchronization: synchronizations[member.name],
          rows_and_sizes: rows_and_sizes
        )
      rescue => exception
        puts exception.to_s + exception.backtrace.join("\n")
      end
    }.compact

    response        = {
      visualizations: representation,
      total_entries:  collection.total_entries
    }
    current_user.update_visualization_metrics
    render_jsonp(response)
  end #index

  def create
    payload.delete(:permission) if payload[:permission].present?
    payload.delete[:permission_id] if payload[:permission_id].present?

    if params[:source_visualization_id]
      source    = Visualization::Member.new(
                    id: params.fetch(:source_visualization_id)
                  ).fetch
      member    = Visualization::Copier.new(
                    current_user, source, name_candidate
                  ).copy
    elsif params[:tables]
      tables    = params[:tables].map do |table_name| 
                    ::Table.find_by_name_subdomain(CartoDB.extract_subdomain(request), table_name)
                  end
      blender   = Visualization::TableBlender.new(current_user, tables)
      map       = blender.blend
      member    = Visualization::Member.new(
                    payload.merge(
                      name:     name_candidate,
                      map_id:   map.id,
                      type:     'derived',
                      privacy:  blender.blended_privacy,
                      user_id:  current_user.id
                    )
                  )
    else
      member    = Visualization::Member.new(
                    payload_with_default_privacy.merge(
                        name: name_candidate,
                        user_id:  current_user.id
                    )
                  )
    end

    member.privacy = member.default_privacy(current_user)

    member.store
    collection  = Visualization::Collection.new.fetch
    collection.add(member)
    collection.store
    current_user.update_visualization_metrics
    render_jsonp(member)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: member.full_errors }, 400)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  end #create

  def show
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return(head 403) unless member.has_permission?(current_user, Visualization::Member::PERMISSION_READONLY)
    render_jsonp(member)
  rescue KeyError
    head(404)
  end #show
  
  def update
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return head(403) unless member.has_permission?(current_user, Visualization::Member::PERMISSION_READWRITE)

    payload.delete(:permission) if payload[:permission].present?
    payload.delete[:permission_id] if payload[:permission_id].present?

    # when a table gets renamed, first it's canonical visualization is renamed, so we must revert renaming if that failed
    # This is far from perfect, but works without messing with table-vis sync and their two backends
    if member.table?
      old_vis_name = member.name

      payload.delete(:url_options) if payload[:url_options].present?
      member.attributes = payload
      new_vis_name = member.name
      old_table_name = member.table.name
      member.store.fetch
      if new_vis_name != old_vis_name && member.table.name == old_table_name
        member.name = old_vis_name
        member.store.fetch
      end
    else
      member.attributes = payload  
      member.store.fetch
    end

    render_jsonp(member)
  rescue KeyError
    head(404)
  rescue CartoDB::InvalidMember
    render_jsonp({ errors: member.full_errors }, 400)
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  end #update

  def destroy
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return(head 403) unless member.is_owner?(current_user)
    member.delete
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
  end #destroy

  def stats
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return(head 401) unless member.has_permission?(current_user, Visualization::Member::PERMISSION_READONLY)
    render_jsonp(member.stats)
  rescue KeyError
    head(404)
  end #stats

  def vizjson1
    visualization,  = locator.get(params.fetch(:id), CartoDB.extract_subdomain(request))
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
  end #vizjson1

  def vizjson2
    visualization,  = locator.get(params.fetch(:id), CartoDB.extract_subdomain(request))
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
  end #vizjson

  private

  def locator
    CartoDB::Visualization::Locator.new
  end #locator

  def scope_for(current_user)
    { user_id: current_user.id }
  end #scope_for

  def allow_vizjson_v1_for?(table)
    table && (table.public? || table.public_with_link_only? || current_user_is_owner?(table))
  end #allow_vizjson_v1_for?

  def allow_vizjson_v2_for?(visualization)
    visualization && (visualization.public? || visualization.public_with_link?)
  end #allow_vizjson_v2_for?

  def current_user_is_owner?(table)
    current_user.present? && (table.owner.id == current_user.id)
  end #current_user_is_owner?

  def set_vizjson_response_headers_for(visualization)
    response.headers['X-Cache-Channel'] = "#{visualization.varnish_key}:vizjson"
    response.headers['Cache-Control']   = 'no-cache,max-age=86400,must-revalidate, public'
  end #set_vizjson_response_headers

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end #payload

  def payload_with_default_privacy
    { privacy: default_privacy }.merge(payload)
  end #payload_with_default_privacy

  def default_privacy
    current_user.private_tables_enabled ? Visualization::Member::PRIVACY_PRIVATE : Visualization::Member::PRIVACY_PUBLIC
  end #default_privacy

  def name_candidate
    Visualization::NameGenerator.new(current_user)
                      .name(params[:name])
  end #name_candidate

  def tables_by_map_id(map_ids)
    Hash[
      ::Table.where(map_id: map_ids).map { |table| [table.map_id, table] }
    ]
  end

  def synchronizations_by_table_name(table_data)
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

  def rows_and_sizes_for(table_data)
    data = Hash.new
    table_data.each { |table|
      row = current_user.in_database.fetch(%Q{
        SELECT
          relname AS table_name,
          pg_total_relation_size(? || '.' || relname) AS total_relation_size,
          reltuples::integer AS reltuples
        FROM pg_class
        WHERE relname=?
      },
      table[:schema],
      table[:name]
      ).first
      data[row[:table_name]] = {
        size: row[:total_relation_size].to_i / 2,
        rows: row[:reltuples]
      }
    }
    data
  end
end # Api::Json::VisualizationsController

