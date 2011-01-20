class Api::Json::TablesController < ApplicationController

  before_filter :login_required

  def show
    @table = Table.select(:id,:user_id,:db_table_name).filter(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id && !@table.public?
    respond_to do |format|
      format.json do
        render :json => @table.to_json(:rows_per_page => params[:rows_per_page], :page => params[:page])
      end
    end
  end

end