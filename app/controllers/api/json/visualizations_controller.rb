# encoding: utf-8
require 'json'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/collection'
require_relative '../../../models/visualization/presenter'
require_relative '../../../models/visualization/locator'
require_relative '../../../models/visualization/watcher'
require_relative '../../../models/map/presenter'
require_relative '../../../../lib/static_maps_url_helper'

require_dependency 'carto/tracking/events'
require_dependency 'carto/visualizations_export_service_2'

class Api::Json::VisualizationsController < Api::ApplicationController
  include CartoDB

  ssl_allowed :notify_watching, :list_watching, :add_like, :remove_like
  ssl_required :create, :update, :set_next_id
  skip_before_filter :api_authorization_required, only: [:add_like, :remove_like]

  before_filter :optional_api_authorization, only: [:add_like, :remove_like]
  before_filter :table_and_schema_from_params, only: [:update, :stats,
                                                      :notify_watching, :list_watching,
                                                      :add_like, :remove_like, :set_next_id]

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

  # TODO: Add stats if is used in the future
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
  rescue
    render_jsonp({ errors: ['Unknown error'] }, 400)
  end

  def add_like
    @stats_aggregator.timing('visualizations.like') do

      begin
        return(head 403) unless current_viewer

        vis = Visualization::Member.new(id: @table_id).fetch

        @stats_aggregator.timing('authorization') do
          raise KeyError if !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY) &&
            vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK
        end

        @stats_aggregator.timing('save') do
          vis.add_like_from(current_viewer.id)
             .fetch
             .invalidate_cache
        end

        current_viewer_id = current_viewer.id
        if current_viewer_id != vis.user.id
          protocol = request.protocol.sub('://', '')
          vis_url = Carto::StaticMapsURLHelper.new.url_for_static_map_with_visualization(vis, protocol, 600, 300)
          send_like_email(vis, current_viewer, vis_url)
        end

        Carto::Tracking::Events::LikedMap.new(current_viewer_id,
                                              user_id: current_viewer_id,
                                              visualization_id: vis.id,
                                              action: 'like').report

        render_jsonp(id: vis.id, likes: vis.likes.count, liked: vis.liked_by?(current_viewer_id))
      rescue KeyError => exception
        render(text: exception.message, status: 403)
      rescue AlreadyLikedError
        render(text: "You've already liked this visualization", status: 400)
      end

    end
  end

  def remove_like
    @stats_aggregator.timing('visualizations.unlike') do
      begin
        return(head 403) unless current_viewer

        vis = Visualization::Member.new(id: @table_id).fetch

        @stats_aggregator.timing('authorization') do
          raise KeyError if !vis.has_permission?(current_viewer, Visualization::Member::PERMISSION_READONLY) &&
            vis.privacy != Visualization::Member::PRIVACY_PUBLIC && vis.privacy != Visualization::Member::PRIVACY_LINK
        end

        current_viewer_id = current_viewer.id
        @stats_aggregator.timing('destroy') do
          vis.remove_like_from(current_viewer_id)
             .fetch
             .invalidate_cache
        end

        Carto::Tracking::Events::LikedMap.new(current_viewer_id,
                                              user_id: current_viewer_id,
                                              visualization_id: vis.id,
                                              action: 'remove').report

        render_jsonp(id: vis.id, likes: vis.likes.count, liked: false)
      rescue KeyError => exception
        render(text: exception.message, status: 403)
      end
    end
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

  def payload
    request.body.rewind
    ::JSON.parse(request.body.read.to_s || String.new, {symbolize_names: true})
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

  def send_like_email(vis, current_viewer, vis_preview_image)
    if vis.type == Carto::Visualization::TYPE_CANONICAL
      ::Resque.enqueue(::Resque::UserJobs::Mail::TableLiked, vis.id, current_viewer.id, vis_preview_image)
    elsif vis.type == Carto::Visualization::TYPE_DERIVED
      ::Resque.enqueue(::Resque::UserJobs::Mail::MapLiked, vis.id, current_viewer.id, vis_preview_image)
    end
  end
end
