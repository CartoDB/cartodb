# coding: UTF-8

class Admin::TablesController < ApplicationController
  ssl_required :index, :show

  before_filter :login_required

  def index
    current_page = params[:page].nil? ? 1 : params[:page].to_i
    per_page = 10
    unless params[:public]
      resp = access_token.get("/v1/tables/tags.json?limit=5")
      if resp.code.to_i == 200
        @tags = JSON.parse(resp.body).map{|h| h["values"]}
      else
        render_500 and return
      end      
      resp = access_token.get("/v1/tables.json?page=#{current_page}&per_page=#{per_page}")
      if resp.code.to_i == 200
        @tables = JSON.parse(resp.body)
        @pagination = { 
          :current_page => current_page, 
          :per_page => per_page, 
          :page_count => (current_user.tables_count.to_f / per_page).ceil, 
          :next_page => current_page < (current_user.tables_count.to_f / per_page).ceil ? current_page + 1 : nil,
          :previous_page => current_page == 1 ? nil : current_page - 1,
          :page_range => (1..(current_user.tables_count.to_f / per_page).ceil)
        }
      else
        render_500 and return
      end
    else
      render_404 and return
      # TODO:
      # @tags = Tag.load_public_tags(current_user.id, :limit => 5)
      # @tables = Table.filter(~{:user_id => current_user.id} & {:privacy => Table::PUBLIC}).order(:id).reverse.
      #                   paginate(current_page, per_page)
      # render :template => 'admin/tables/index_public' and return
    end
  end

  def show
    @table = Table.filter(:id => params[:id]).first
    raise RecordNotFound if @table.nil? || (@table.user_id != current_user.id && @table.private?)

    respond_to do |format|
      format.html
      format.csv do
        send_data @table.to_csv,
          :type => 'application/zip; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"
      end
      format.kml
      format.shp do
        send_data @table.to_shp,
          :type => 'application/octet-stream; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"

      end
    end
  end

end