# coding: UTF-8

class Admin::TablesController < ApplicationController
  ssl_required :index, :show

  before_filter :login_required

  def index
    current_page = params[:page].nil? ? 1 : params[:page].to_i
    per_page = 10
    @tags = Tag.load_user_tags(current_user.id, :limit => 5)
    @tables = if !params[:tag_name].blank?
      Table.find_all_by_user_id_and_tag(current_user.id, params[:tag_name]).order(:id).reverse.paginate(current_page, per_page)
    else
      Table.filter({:user_id => current_user.id}).order(:id).reverse.paginate(current_page, per_page)
    end
  end

  def show
    @table = Table.find_by_identifier(current_user.id, params[:id])
    respond_to do |format|
      format.html
      format.csv do
        send_data @table.to_csv,
          :type => 'application/zip; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"
      end
      format.shp do
        send_data @table.to_shp,
          :type => 'application/octet-stream; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"
      end
    end
  end

end