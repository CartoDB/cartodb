# coding: utf-8

# This controller is for internal usage, so has not been documented yet
# If it's useful can be added to the documentation
class Api::Json::ExportTablesController < Api::ApplicationController
  ssl_required :show

  def show
    @table = Table.find_by_identifier(current_user.id, params[:table_id])
    
    respond_to do |format|
      format.csv { render :text => @table.to_csv }
      format.shp { render :text => @table.to_shp }
    end
  end
end