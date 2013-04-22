# encoding: utf-8
require 'json'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/presenter'
require_relative '../../../models/visualization/collection'

class Api::Json::VisualizationsController < Api::ApplicationController
  include CartoDB

  ssl_required :index, :show, :create, :update, :destroy
  skip_before_filter :api_authorization_required, only: [:vizzjson]

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
    member      = Visualization::Member.new(payload).store
    collection  = Visualization::Collection.new.fetch
    collection.add(member)
    collection.store

    render_jsonp(member)
  end #create

  def show
    begin
      member    = Visualization::Member.new(id: params.fetch('id')).fetch
      (head(201) and return) unless member.authorize?(current_user)
      render_jsonp(member)
    rescue KeyError
      head :not_found
    end
  end #show
  
  def update
    begin
      member    = Visualization::Member.new(id: params.fetch('id')).fetch
      (head(201) and return) unless member.authorize?(current_user)

      member.attributes = payload
      member.store
      render_jsonp(member)
    rescue KeyError
      head :not_found
    end
  end #update

  def destroy
    member      = Visualization::Member.new(id: params.fetch('id')).fetch
    (head(201) and return) unless member.authorize?(current_user)

    member.delete
    head 204
  end #destroy

  def vizzjson
    member = Visualization::Member.new(id: params[:id]).fetch
    (head 204 and return) unless member.public?
    render_jsonp(member.to_vizzjson)
  rescue KeyError
    head :forbidden
  end #vizzjson

  def map
    head(204)
  end #map

  def table
    head(204)
  end #table

  private

  def scope_for(current_user)
    { map_id: current_user.maps.map(&:id) }
  end #scope_for

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end #payload
end # Api::Json::VisualizationsController

