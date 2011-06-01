# coding: UTF-8

# This controller is for internal usage, so has not been documented yet
# If it's useful can be added to the documentation
class Api::Json::ExportTablesController < Api::ApplicationController
  ssl_required :show

  before_filter :load_table

  def show
    respond_to do |format|
      format.csv { render :text => @table.to_csv }
      format.shp { render :text => @table.to_shp }
    end
  end
  
  protected
  
  def load_table
    @table = Table.find_by_identifier(current_user.id, params[:table_id])
  end
  
end