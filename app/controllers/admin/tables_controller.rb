# coding: UTF-8

class Admin::TablesController < ApplicationController
  ssl_required :index, :show

  before_filter :login_required

  def index
    current_page = params[:page].nil? ? 1 : params[:page].to_i
    per_page = 10
    unless params[:public]
      resp = access_token.get("/v1/tables/tags?limit=5")
      if resp.code.to_i == 200
        @tags = Yajl::Parser.new.parse(resp.body)
      else
        render_500 and return
      end
      if params[:tag_name]
        @tag_name = params[:tag_name].sanitize.tr('_',' ')
        resp = access_token.get(URI.encode("/v1/tables/tags/#{@tag_name}?page=#{current_page}&per_page=#{per_page}"))
      else
        resp = access_token.get("/v1/tables?page=#{current_page}&per_page=#{per_page}")
      end
      if resp.code.to_i == 200
        response = Yajl::Parser.new.parse(resp.body)
        @tables = response["tables"]
        count = @tables.empty? ? 0 : response["total_entries"]
        @pagination = { 
          :current_page => current_page, 
          :per_page => per_page, 
          :page_count => (count.to_f / per_page).ceil, 
          :next_page => current_page < (count.to_f / per_page).ceil ? current_page + 1 : nil,
          :previous_page => current_page == 1 ? nil : current_page - 1,
          :page_range => (1..(count.to_f / per_page).ceil),
          :total_entries => count
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
    id = params[:id].sanitize.tr('_',' ')
    resp = access_token.get("/v1/tables/#{id}")
    if resp.code.to_i == 200
      @table = Yajl::Parser.new.parse(resp.body)
    else
      render_404 and return
    end

    respond_to do |format|
      format.html
      format.csv do
        resp = access_token.get("/v1/tables/#{id}/export/#{params[:format]}") 
        if resp.code.to_i == 200
          send_data resp.body,
            :type => 'application/octet-stream; charset=binary; header=present',
            :disposition => "attachment; filename=#{@table["name"]}.zip"
        else
          render_404 and return
        end
      end
      format.shp do
        resp = access_token.get("/v1/tables/#{id}/export/#{params[:format]}") 
        if resp.code.to_i == 200
          send_data resp.body,
            :type => 'application/octet-stream; charset=binary; header=present',
            :disposition => "attachment; filename=#{@table["name"]}.zip"
        else
          render_404 and return
        end
      end
    end
  end

end