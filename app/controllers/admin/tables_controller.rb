# coding: UTF-8

class Admin::TablesController < ApplicationController
  ssl_required :index, :show

  before_filter :login_required

  def index
    current_page = params[:page].nil? ? 1 : params[:page].to_i
    per_page = 10
    unless params[:public]
      @tags   = Tag.load_user_tags(current_user.id, :limit => 5)
      @tables = Table.filter(:user_id => current_user.id).order(:id).reverse.select(:id,:name,:privacy,:updated_at,:tags,:user_id,:stored_schema).
                        paginate(current_page, per_page, current_user.tables_count)
    else
      @tags = Tag.load_public_tags(current_user.id, :limit => 5)
      @tables = Table.filter(~{:user_id => current_user.id} & {:privacy => Table::PUBLIC}).order(:id).reverse.
                      select(:id,:name,:privacy,:updated_at,:tags,:user_id,:stored_schema).paginate(current_page, per_page)
      render :template => 'admin/tables/index_public' and return
    end
  end

  def show
    @table = Table.select(:id,:name,:privacy,:user_id,:tags,:stored_schema).filter(:id => params[:id]).first
    raise RecordNotFound if @table.nil? || (@table.user_id != current_user.id && @table.private?)
  end

end