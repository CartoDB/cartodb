# encoding: utf-8
require_relative '../../models/map/presenter'
require_relative '../../models/visualization/locator'

class Admin::VisualizationsController < ApplicationController
  ssl_allowed :embed_map
  ssl_required :index, :show
  before_filter :login_required, only: [:index]
  skip_before_filter :browser_is_html5_compliant?, only: [:embed_map, :track_embed]

  def index
    @tables_count  = current_user.tables.count
    @first_time    = !current_user.dashboard_viewed?
    current_user.view_dashboard
    update_user_last_activity
  end #index

  def show
    id = params.fetch(:id)
    return(redirect_to public_url_for(id)) unless current_user.present?
    @visualization, @table = locator.get(id, request.subdomain)
    return(pretty_404) unless @visualization
    respond_to { |format| format.html }

    update_user_last_activity
  end #show

  def public
    id = params.fetch(:id)
    @visualization, @table = locator.get(id, request.subdomain)

    id = params.fetch(:id)
    return(pretty_404) if @visualization.nil? || @visualization.private?
    return(redirect_to embed_map_url_for(id)) if @visualization.derived?
    
    @vizjson = @visualization.to_vizjson

    respond_to do |format|
      format.html { render 'public', layout: 'application_public' }
    end
  end #public

  def embed_map
    id = params.fetch(:id)
    @visualization, @table = locator.get(id, request.subdomain)
    
    return(pretty_404) unless @visualization
    return(embed_forbidden) if @visualization.private?

    respond_to do |format|
      format.html { render layout: false }
      format.js { render 'embed_map', content_type: 'application/javascript' }
    end
  rescue
    embed_forbidden
  end #embed_map

  def embed_forbidden
    render 'embed_map_error', layout: false, status: :forbidden
  end #embed_forbidden

  def track_embed
    response.headers['X-Cache-Channel'] = "embeds_google_analytics"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"
    render 'track', layout: false
  end #track_embed

  private

  def public_url_for(id)
    "/#{resource_base}/#{id}/public"
  end #public_url_for

  def embed_map_url_for(id)
    "/#{resource_base}/#{id}/embed_map"
  end #public_url_for

  def resource_base
    return 'viz'    if request.path_info =~ %r{/viz/}
    return 'tables' if request.path_info =~ %r{/tables/}
  end #resource_base

  def download_formats table, format
    format.sql  { send_data table.to_sql, data_for(table, 'zip', 'zip') }
    format.kml  { send_data table.to_kml, data_for(table, 'zip', 'kmz') }
    format.csv  { send_data table.to_csv, data_for(table, 'zip', 'zip') }
    format.shp  { send_data table.to_shp, data_for(table, 'octet-stream', 'zip') }
  end

  def data_for(table, type, extension)
    { 
      type:         "application/#{type}; charset=binary; header=present",
      disposition:  "attachment; filename=#{table.name}.#{extension}"
    }
  end

  def update_user_last_activity
    return false unless current_user.present?
    current_user.set_last_active_time
    current_user.set_last_ip_address request.remote_ip
  end

  def pretty_404
    render(file: "public/404", layout: false, status: 404)
  end #pretty_404

  def locator
    CartoDB::Visualization::Locator.new
  end #locator
end # VisualizationsController

