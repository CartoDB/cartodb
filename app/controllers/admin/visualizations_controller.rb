# encoding: utf-8
require_relative '../../models/map/presenter'
require_relative '../../models/visualization/locator'

class Admin::VisualizationsController < ApplicationController
  ssl_required :index, :show
  skip_before_filter :browser_is_html5_compliant?, only: [:embed_map]

  def index
    login_required
    update_user_api_calls
    @tables_count  = current_user.tables.count
    update_user_last_activity
  end #index

  def show
    update_user_api_calls
    if current_user.present?
      @visualization, @table = locator.get(params.fetch(:id), request.subdomain)
      respond_to { |format| format.html }
    else
      redirect_to "/viz/#{params[:id]}/public"
    end

    update_user_last_activity
  end #show

  def public
    @visualization, @table = locator.get(params.fetch(:id), request.subdomain)

    respond_to do |format|
      format.html { render 'public', layout: 'application_public' }
    end
  end #public

  def embed_map
    @visualization, @table = locator.get(params.fetch(:id), request.subdomain)

    return(head :forbidden) if @table.blank? || @table.private?

    respond_to do |format|
      format.html { render layout: false }
      format.js { render 'embed_map', content_type: 'application/javascript' }
    end
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
  end

  def update_user_api_calls
    return false unless current_user.present?
    current_user.set_api_calls
  end

  def locator
    CartoDB::Visualization::Locator.new
  end #locator
end # VisualizationsController

