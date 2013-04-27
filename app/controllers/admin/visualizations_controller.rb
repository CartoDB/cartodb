# encoding: utf-8

class Admin::VisualizationsController < ApplicationController
  ssl_required :index, :show
  skip_before_filter :browser_is_html5_compliant?, only: [:embed_map]

  def index
    login_required
    update_user_api_calls
    @tables_count  = current_user.tables.count
    update_user_last_activity
  end

  def show
    update_user_api_calls

    if current_user.present?
      @visualization = 
        CartoDB::Visualization::Locator.new.get(params.fetch(:id))
      respond_to { |format| format.html }
    else
      redirect_to "/viz/#{params[:id]}/public"
    end

    update_user_last_activity
  end

  def public
    @visualization = 
      CartoDB::Visualization::Locator.new.get(params.fetch(:id))

    respond_to do |format|
      format.html { render 'public', layout: 'application_public' }
    end
  end

  def embed_map
    @visualization = 
      CartoDB::Visualization::Locator.new.get(params.fetch(:id))
    @table = @visualization.table

    if @table.blank? || @table.private?
      head :forbidden
    else
      respond_to do |format|
        format.html { render layout: false }
        format.js { render 'embed_map.js.erb', content_type: 'application/javascript' }
      end
    end
  end

  def track_embed
    response.headers['X-Cache-Channel'] = "embeds_google_analytics"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"
    render 'track.html.erb', layout: false
  end

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
end # VisualizationsController

