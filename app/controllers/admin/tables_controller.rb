class Admin::TablesController < ApplicationController

  before_filter :login_required

  def show
    @table = Table[params[:id]]
    raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id
  end

end