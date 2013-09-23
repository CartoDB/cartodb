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

class Api::Json::VisualizationsController < Api::ApplicationController
  include CartoDB
  
  ssl_allowed :vizjson1, :vizjson2
  ssl_required :index, :show, :create, :update, :destroy
  skip_before_filter :api_authorization_required, only: [:vizjson1, :vizjson2]
  before_filter :link_ghost_tables, only: [:index, :show]

  def index
    collection      = Visualization::Collection.new.fetch(
                        params.dup.merge(scope_for(current_user))
                      )
    map_ids         = collection.map(&:map_id).to_a
    tables          = tables_by_map_id(map_ids)

    representation  = collection.map { |member|
      member.to_hash(
        related:    false,
        table_data: !(params[:table_data] =~ /false/),
        user:       current_user,
        table:      tables[member.map_id]
      )
    }

    response        = {
      visualizations: representation,
      total_entries:  collection.total_entries
    }
    render_jsonp(response)
  end #index

  def create
    if params[:source_visualization_id]
      source    = Visualization::Member.new(
                    id: params.fetch(:source_visualization_id)
                  ).fetch
      member    = Visualization::Copier.new(
                    current_user, source, name_candidate
                  ).copy
    elsif params[:tables]
      tables    = params[:tables].map do |table_name| 
                    ::Table.find_by_subdomain(request.subdomain, table_name)
                  end
      blender   = Visualization::TableBlender.new(current_user, tables)
      map       = blender.blend
      member    = Visualization::Member.new(
                    payload.merge(
                      name:     name_candidate,
                      map_id:   map.id,
                      type:     'derived',
                      privacy:  blender.blended_privacy
                    )
                  )
    else
      member    = Visualization::Member.new(
                    payload_with_default_privacy.merge(name: name_candidate)
                  )
    end

    member.store
    collection  = Visualization::Collection.new.fetch
    collection.add(member)
    collection.store
    render_jsonp(member)
  rescue CartoDB::InvalidMember => exception
    render_jsonp({ errors: member.full_errors }, 400)
  end #create

  def show
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return(head 401) unless member.authorize?(current_user)
    render_jsonp(member)
  rescue KeyError
    head(404)
  end #show
  
  def update
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return head(401) unless member.authorize?(current_user)

    member.attributes = payload
    member.store.fetch
    render_jsonp(member)
  rescue KeyError
    head(404)
  rescue CartoDB::InvalidMember => exception
    render_jsonp({ errors: member.full_errors }, 400)
  end #update

  def destroy
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return(head 401) unless member.authorize?(current_user)

    member.delete
    return head 204
  rescue KeyError
    head(404)
  end #destroy

  def stats
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return(head 401) unless member.authorize?(current_user)
    render_jsonp(member.stats)
  rescue KeyError
    head(404)
  end #stats

  def vizjson1
    visualization, table = locator.get(params.fetch(:id), request.subdomain)
    return(head 404) unless visualization
    return(head 403) unless allow_vizjson_v1_for?(visualization.table)
    set_vizjson_response_headers_for(visualization)
    render_jsonp(CartoDB::Map::Presenter.new(
      visualization.map, 
      { full: false, url: "/api/v1/tables/#{visualization.table.id}" },
      Cartodb.config, 
      CartoDB::Logger
    ).to_poro)
  end #vizjson1

  def vizjson2
    visualization, table = locator.get(params.fetch(:id), request.subdomain)
    return(head 404) unless visualization
    return(head 403) unless allow_vizjson_v2_for?(visualization)
    set_vizjson_response_headers_for(visualization)
    render_jsonp(visualization.to_vizjson)
  rescue KeyError => exception
    render(text: exception.message, status: 403)
  end #vizjson

  private

  def locator
    CartoDB::Visualization::Locator.new
  end #locator

  def scope_for(current_user)
    { map_id: current_user.maps.map(&:id) }
  end #scope_for

  def allow_vizjson_v1_for?(table)
    table && (table.public? || current_user_is_owner?(table))
  end #allow_vizjson_v1_for?

  def allow_vizjson_v2_for?(visualization)
    visualization && visualization.public?
  end #allow_vizjson_v2_for?

  def current_user_is_owner?(table)
    current_user.present? && (table.owner.id == current_user.id)
  end #current_user_is_owner?

  def set_vizjson_response_headers_for(visualization)
    response.headers['X-Cache-Channel'] = 
      "#{visualization.varnish_key}:vizjson"
    response.headers['Cache-Control']   =
      "no-cache,max-age=86400,must-revalidate, public"
  end #set_vizjson_response_headers

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end #payload

  def payload_with_default_privacy
    { privacy: default_privacy}.merge(payload)
  end #payload_with_default_privacy

  def default_privacy
    current_user.private_tables_enabled ? 'private' : 'public'
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
end # Api::Json::VisualizationsController

