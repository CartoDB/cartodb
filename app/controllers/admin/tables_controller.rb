# coding: UTF-8

class Admin::TablesController < ApplicationController

  before_filter :login_required

  def index
    unless params[:public]
      @tables = current_user.tables.select(:id,:name,:privacy,:updated_at).all
    else
      @tables = Table.filter(~{:user_id => current_user.id} & {:privacy => Table::PUBLIC}).select(:id,:name,:privacy,:updated_at).all
      render :template => 'admin/tables/index_public' and return
    end
  end

  def show
    @table = Table.select(:id,:name,:privacy,:user_id).filter(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id && @table.private?
  end

end