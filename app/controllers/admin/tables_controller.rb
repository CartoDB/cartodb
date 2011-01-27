# coding: UTF-8

class Admin::TablesController < ApplicationController

  before_filter :login_required

  def index
    unless params[:public]
      @tags = Tag.fetch("select tags.name, count(*) as count
                          from tags
                          where tags.user_id = ?
                          group by tags.name
                          order by count desc limit 5", current_user.id).all
      @tables = current_user.tables.select(:id,:name,:privacy,:updated_at,:tags).all
    else
      @tags = Tag.fetch("select tags.name, count(*) as count
                          from tags
                          where tags.user_id != ?
                          group by tags.name
                          order by count desc limit 5", current_user.id).all
      @tables = Table.filter(~{:user_id => current_user.id} & {:privacy => Table::PUBLIC}).
                      select(:id,:name,:privacy,:updated_at,:tags).all
      render :template => 'admin/tables/index_public' and return
    end
  end

  def show
    @table = Table.select(:id,:name,:privacy,:user_id,:tags).filter(:id => params[:id]).first
    #raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id && @table.private?
  end

end