# encoding: utf-8
require 'json'
require_relative '../../../models/overlay/member'
require_relative '../../../models/overlay/collection'
require_relative '../../../models/overlay/presenter'

class Api::Json::OverlaysController < Api::ApplicationController
  include CartoDB

  ssl_required :index, :show, :create, :update, :destroy

  def index
    collection  = Overlay::Collection.new(
      visualization_id: params.fetch('visualization_id'),
    ).fetch
    render_jsonp(collection)
  rescue KeyError => exception
    head :not_found
  end #index

  def create
    member_attributes = payload.merge(
      type:       params[:type],
      options:    params[:options],
      template:   params[:template],
      order:      params[:order]
    )

    member      = Overlay::Member.new(member_attributes).store
    render_jsonp(member.attributes)
  end #create

  def show
    member    = Overlay::Member.new(id: params.fetch('id')).fetch
    render_jsonp(member.attributes)
  rescue KeyError
    head :not_found
  end #show

  def update
    member            = Overlay::Member.new(id: params.fetch('id')).fetch
    member.attributes = payload
    member.store
    render_jsonp(member.attributes)
  rescue KeyError
    head :not_found
  end #update

  def destroy
    member      = Overlay::Member.new(id: params.fetch('id'))
    member.delete
    head 204
  end #destroy

  def payload
    ::JSON.parse(request.body.read.to_s || String.new)
      .merge('visualization_id' => params.fetch('visualization_id'))
  end #payload
end # Api::Json::OverlaysController

