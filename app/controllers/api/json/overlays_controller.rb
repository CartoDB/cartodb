# encoding: utf-8
require 'json'
require_relative '../../../models/overlay/collection'
require_relative '../../../models/overlay/presenter'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/locator'

class Api::Json::OverlaysController < Api::ApplicationController
  include CartoDB

  ssl_required :create, :update, :destroy
  before_filter :check_owner_by_vis, only: [ :create ]
  before_filter :check_owner_by_id, only: [ :update, :destroy ]

  def create
    member_attributes = payload.merge(
      type:       params[:type],
      options:    params[:options],
      template:   params[:template],
      order:      params[:order]
    )

    member= Overlay::Member.new(member_attributes).store
    render_jsonp(member.attributes)
  end

  def update
    member = Overlay::Member.new(id: params.fetch('id')).fetch
    member.attributes = payload
    member.store
    render_jsonp(member.attributes)
  rescue KeyError
    head :not_found
  end

  def destroy
    member = Overlay::Member.new(id: params.fetch('id'))
    member.delete
    head 204
  end

  protected

  def payload
    ::JSON.parse(request.body.read.to_s || String.new)
      .merge('visualization_id' => params.fetch('visualization_id'))
  end

  def check_owner_by_id
    head 401 and return if current_user.nil?

    member = Overlay::Member.new(id: params.fetch('id')).fetch
    head 401 and return if member.nil?

    vis = Visualization::Member.new(id: member.visualization_id).fetch
    head 403 and return if vis.user_id != current_user.id
  end

  def check_owner_by_vis
    head 401 and return if current_user.nil?
    vis_id = params.fetch('visualization_id')
    vis_id, schema = table_and_schema_from(vis_id)

    vis,  = locator.get(vis_id, CartoDB.extract_subdomain(request))
    head 401 and return if vis.nil?

    head 403 and return if vis.user_id != current_user.id && !vis.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
  end

  private

  def table_and_schema_from(param)
    if param =~ /\./
      @table_id, @schema = param.split('.').reverse
    else
      @table_id, @schema = [param, nil]
    end
  end

  def locator
    CartoDB::Visualization::Locator.new
  end

end

