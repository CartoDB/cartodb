# coding: utf-8

class Admin::TablesController < ApplicationController
  ssl_required :index, :show, :embed_map, :show_public, :index_public

  skip_before_filter :browser_is_html5_compliant?, :only => [:embed_map]
  before_filter      :login_required,              :only => [:index]
  after_filter       :update_user_last_activity,   :only => [:index, :show]

  def index
    @tags          = Tag.load_user_tags(current_user.id, :limit => 100)
    @quota         = current_user.quota_in_bytes / 1024 / 1024
    @database_size = current_user.db_size_in_bytes / 1024 /1024
    @table_quota   = current_user.table_quota
    @tables_count  = current_user.tables.count
  end

  # We only require login for index, so we must manage the security at this level.
  # we present different actions depending on if there is a user logged in or not.
  # if the user is not logged in, we redirect them to the public page
  def show
    if current_user.present?
      update_user_last_activity
      @table = Table.find_by_identifier(current_user.id, params[:id])
      begin
        respond_to do |format|
          format.html
          download_formats @table, format
        end
      rescue
        redirect_to table_path(@table), :alert => "There was an error exporting the table"
      end
    else
      redirect_to public_table_path(params[:id], :format => params[:format])
    end
  end

  def show_public
    @subdomain = request.subdomain
    @table     = Table.find_by_subdomain(@subdomain, params[:id])

    # Has quite strange checks to see if a user can access a public table
    if @table.blank? || (!current_user && @table.private?) || ((current_user && current_user.id != @table.owner.id) && @table.private?)
      render_403
    else
      begin
        respond_to do |format|
          format.html { render 'show_public', :layout => 'application_public' }
          download_formats @table, format
        end
      rescue
        redirect_to public_table_path(@table), :alert => "There was an error exporting the table"
      end
    end
  end

  def embed_map
    # Code done with ♥ by almost every human being working at @vizzuality
    @subdomain = request.subdomain
    @table = Table.find_by_subdomain(@subdomain, params[:id])

    if @table.blank? || @table.private?
      head :forbidden
    else
      render :layout => false
    end
  end

  private
  def download_formats table, format
    format.sql  { send_data table.to_sql, send_data_conf(table, 'zip', 'zip') }
    format.kml  { send_data table.to_kml, send_data_conf(table, 'zip', 'kmz') }
    format.csv  { send_data table.to_csv, send_data_conf(table, 'zip', 'zip') }
    format.shp  { send_data table.to_shp, send_data_conf(table, 'octet-stream', 'zip') }
  end

  def send_data_conf table, type, ext
    { :type => "application/#{type}; charset=binary; header=present",
      :disposition => "attachment; filename=#{table.name}.#{ext}" }
  end

  def update_user_last_activity
    return true unless current_user.present?
    current_user.set_last_active_time
  end
end
