# encoding: utf-8
require 'json'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/presenter'
require_relative '../../../models/visualization/collection'

class Api::Json::VisualizationsController < Api::ApplicationController
  include CartoDB::Visualization

  ssl_required :index, :show, :create, :update, :destroy
  skip_before_filter :api_authorization_required, only: [:create, :vizzjson]

  def index
    collection  = Visualization::Collection.new.fetch(params.dup)
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

    render_jsonp(member.attributes)
  end #create

  def show
    begin
      member    = Visualization::Member.new(id: params.fetch('id')).fetch
      render_jsonp(member.attributes)
    rescue KeyError
      head :not_found
    end
  end #show
  
  def update
    begin
      member            = Visualization::Member.new(id: params.fetch('id')).fetch
      member.attributes = payload
      member.store
      render_jsonp(member.attributes)
    rescue KeyError
      head :not_found
    end
  end #update

  def destroy
    member      = Member.new(id: params.fetch('id'))
    member.delete
    head 204
  end #destroy

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new)
  end #payload

  def vizzjson
    begin
      member    = Member.new(id: params[:id]).fetch
      return [200, member.to_json] if member.public?
      [204]
    rescue KeyError
      head :forbidden
    end
  end #vizzjson
end # API

