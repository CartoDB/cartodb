class Admin::TablesController < ApplicationController

  before_filter :login_required

  def index
    @tables = current_user.tables.select(:id,:name,:privacy).all
  end

  def show
    @table = Table.select(:id,:name,:privacy,:user_id).filter(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id
  end

end