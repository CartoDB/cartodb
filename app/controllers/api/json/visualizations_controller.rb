# encoding: utf-8
require 'json'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/presenter'
require_relative '../../../models/visualization/collection'
require_relative '../../../models/visualization/locator'
require_relative '../../../models/visualization/copier'
require_relative '../../../models/visualization/table_blender'
require_relative '../../../models/map/presenter'

class Api::Json::VisualizationsController < Api::ApplicationController
  include CartoDB

  ssl_required :index, :show, :create, :update, :destroy
  skip_before_filter :api_authorization_required, only: [:vizjson1, :vizjson2]

  def index
    collection  = Visualization::Collection.new.fetch(
      params.dup.merge(scope_for(current_user))
    )
    response    = {
      visualizations: collection,
      total_entries:  collection.count
    }
    render_jsonp(response)
  end #index

  def create
    if params[:source_visualization_id]
      source    = Visualization::Member.new(
                    id: params.fetch(:source_visualization_id)
                  ).fetch
      member    = Visualization::Copier.new(
                    current_user, source, params.fetch(:name, nil)
                  ).copy.store
    elsif params[:tables]
      tables    = params[:tables].map do |table_name| 
                    ::Table.find_by_subdomain(request.subdomain, table_name)
                  end
      map       = Visualization::TableBlender.new(current_user, tables).blend
      member    = Visualization::Member.new(
                    payload.merge(map_id: map.id, type: 'derived')
                  )
      member.store
    else
      member    = Visualization::Member.new(payload).store
    end

    collection  = Visualization::Collection.new.fetch
    collection.add(member)
    collection.store
    render_jsonp(member)
  end #create

  def show
    begin
      member = Visualization::Member.new(id: params.fetch('id')).fetch
      return(head 401) unless member.authorize?(current_user)
      render_jsonp(member)
    rescue KeyError
      head :not_found
    end
  end #show
  
  def update
    begin
      member = Visualization::Member.new(id: params.fetch('id')).fetch
      return head(401) unless member.authorize?(current_user)

      member.attributes = payload
      member.store
      render_jsonp(member)
    rescue KeyError
      head :not_found
    end
  end #update

  def destroy
    member = Visualization::Member.new(id: params.fetch('id')).fetch
    return(head 401) unless member.authorize?(current_user)

    member.delete
    return head 204
  end #destroy

  def vizjson1
    @visualization, @table = locator.get(params.fetch(:id), request.subdomain)
    return(head 403) unless allow_vizjson_v1_for?(@visualization.table)
    set_vizjson_response_headers_for(@visualization.table)
    render_jsonp(CartoDB::Map::Presenter.new(
      @visualization.map, 
      { full: false, url: "/api/v1/tables/#{@visualization.table.id}" },
      Cartodb.config, 
      CartoDB::Logger
    ).to_poro)
  end #vizjson1

  def vizjson2
    @visualization, @table = locator.get(params.fetch(:id), request.subdomain)
    return(head 403) unless allow_vizjson_v2_for?(@visualization)
    #set_vizjson_response_headers_for(@table)
    render_jsonp(@visualization.to_vizjson)
  rescue KeyError
    head 403
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

  def set_vizjson_response_headers_for(table)
    response.headers['X-Cache-Channel'] = 
      "#{table.varnish_key}:vizjson"
    response.headers['Cache-Control']   =
      "no-cache,max-age=86400,must-revalidate, public"
  end #set_vizjson_response_headers

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end #payload
end # Api::Json::VisualizationsController

