# coding: UTF-8

class Admin::TablesController < ApplicationController

  before_filter :login_required

  def index
    @tables = unless params[:public]
      current_user.tables.select(:id,:name,:privacy,:updated_at).all
    else
      Table.filter(~{:user_id => current_user.id} & {:privacy => Table::PUBLIC}).select(:id,:name,:privacy,:updated_at).all
    end
  end

  def show
    @table = Table.select(:id,:name,:privacy,:user_id).filter(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id && !@table.public?
  end

end