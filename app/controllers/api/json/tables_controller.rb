class Api::Json::TablesController < ApplicationController

  before_filter :login_required, :load_table

  def show
    respond_to do |format|
      format.json do
        render :json => @table.to_json(:rows_per_page => params[:rows_per_page], :page => params[:page])
      end
    end
  end

  def toggle_privacy
    @table.toggle_privacy!
    respond_to do |format|
      format.json do
        render :json => { :privacy => table_privacy_text(@table) }.to_json
      end
    end
  end

  protected

  def load_table
    @table = Table.select(:id,:user_id,:db_table_name,:privacy).filter(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id && @table.private?
  end

end