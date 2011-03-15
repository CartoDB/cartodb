# coding: UTF-8

class Api::Json::TablesController < ApplicationController
  ssl_required :index, :show, :create, :query, :schema, :toggle_privacy, :update, :update_schema, :create_row, :update_row,
               :delete, :set_geometry_columns, :get_address_column, :addresses, :delete_row, :update_geometry


  skip_before_filter :verify_authenticity_token

  before_filter :api_authorization_required
  before_filter :load_table, :only => [:show, :update, :destroy]

  def index
    @tables = Table.fetch("select user_tables.id,user_tables.user_id,user_tables.name,user_tables.privacy,user_tables.geometry_columns,
                            array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ?", current_user.id).all
    render :json => @tables.map{ |table|
              {
                :id => table.id,
                :name => table.name,
                :privacy => table_privacy_text(table),
                :tags => table[:tags_names],
                :schema => table.schema(:cartodb_types => true)
              }
            }.to_json,
           :callback => params[:callback]
  end

  def create
    @table = Table.new
    @table.user_id = current_user.id
    @table.name = params[:name] if params[:name]
    if params[:file]
      @table.import_from_file = params[:file]
      if $progress[params["X-Progress-ID".to_sym]].nil?
        $progress[params["X-Progress-ID".to_sym]] = 0
      end
    end
    @table.force_schema = params[:schema] if params[:schema]
    if @table.valid? && @table.save
      render :json => { :id => @table.id, :name => @table.name, :schema => @table.schema(:cartodb_types => true) }.to_json,
             :status => 200,
             :location => table_path(@table),
             :callback => params[:callback]
    else
      render :json => { :errors => @table.errors.full_messages }.to_json, :status => 400, :callback => params[:callback]
    end
  rescue => e
    render :json => { :errors => [translate_error(e.message.split("\n").first)] }.to_json,
           :status => 400, :callback => params[:callback] and return
  end

  def show
    render :json => {
              :id => @table.id,
              :name => @table.name,
              :privacy => table_privacy_text(@table),
              :tags => @table[:tags_names],
              :schema => @table.schema(:cartodb_types => true)
            }.to_json,
           :callback => params[:callback]
  end

  def update
    @table = Table.filter(:user_id => current_user.id, :name => params[:id]).first
    @table.set_all(params)
    if params.keys.include?("latitude_column") && params.keys.include?("longitude_column")
      latitude_column = params[:latitude_column] == "nil" ? nil : params[:latitude_column].try(:to_sym)
      longitude_column = params[:longitude_column] == "nil" ? nil : params[:longitude_column].try(:to_sym)
      @table.set_lat_lon_columns!(latitude_column, longitude_column)
    elsif params.keys.include?("address_column")
      address_column = params[:address_column] == "nil" ? nil : params[:address_column].try(:to_sym)
      @table.set_address_column!(address_column)
    end
    @table.tags = params[:tags] if params[:tags]
    if @table.save
      @table = Table.fetch("select user_tables.id,user_tables.user_id,user_tables.name,user_tables.privacy,user_tables.geometry_columns,
                              array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                            from user_tables
                            where id=?",@table.id).first
      render :json => {
        :id => @table.id,
        :name => @table.name,
        :privacy => table_privacy_text(@table),
        :tags => @table[:tags_names],
        :schema => @table.schema(:cartodb_types => true)
      }.to_json, :status => 200, :callback => params[:callback]
    else
      render :json => { :errors => @table.errors.full_messages}.to_json, :status => 400, :callback => params[:callback]
    end
  rescue => e
    render :json => { :errors => [translate_error(e.message.split("\n").first)] }.to_json,
           :status => 400, :callback => params[:callback] and return
  end

  def destroy
    @table = Table.fetch("select id, user_id, name
                          from user_tables
                          where user_tables.user_id = ? and user_tables.name = ?", current_user.id, params[:id]).all.first
    raise RecordNotFound if @table.nil?
    @table.destroy
    render :nothing => true, :status => 200, :callback => params[:callback]
  end


  def set_geometry_columns
    if params.keys.include?("lat_column") && params.keys.include?("lon_column")
      lat_column = params[:lat_column] == "nil" ? nil : params[:lat_column].try(:to_sym)
      lon_column = params[:lon_column] == "nil" ? nil : params[:lon_column].try(:to_sym)
      @table.set_lat_lon_columns!(lat_column, lon_column)
      render :json => ''.to_json, :status => 200, :callback => params[:callback]
    elsif params.keys.include?("address_column")
      address_column = params[:address_column] == "nil" ? nil : params[:address_column].try(:to_sym)
      @table.set_address_column!(address_column)
      render :json => ''.to_json, :status => 200, :callback => params[:callback]
    else
      render :json => { :errors => ["Invalid parameters"] }.to_json,
             :status => 400, :callback => params[:callback] and return
    end
  rescue => e
    render :json => { :errors => [translate_error(e.message.split("\n").first)] }.to_json,
           :status => 400, :callback => params[:callback] and return
  end

  # Get the column with is geolocating via address
  # * Request Method: +GET+
  # * URI: +/api/json/tables/:id/get_address_column
  # * Format: +JSON+
  # * Response if _success_:
  #   * status code: 200
  #   * {'address_column' => 'name of the address column'}
  def get_address_column
    response = if @table.address_column
      {'address_column' => @table.address_column.to_s}
    else
      ''
    end
    render :json => response.to_json, :status => 200, :callback => params[:callback]
  end

  # Get the values from the address column
  # * Request Method: +GET+
  # * URI: +/api/json/tables/:id/addresses
  # * Format: +JSON+
  # * Sample response if _success_:
  #   * status code: 200
  #   * {
  #       "time":0.006813764572143555,
  #       "total_rows":10,
  #       "columns": ["cartodb_id","address"],
  #       "rows": [{"cartodb_id":1,"address":"SHJxJxdTeyc"},{"cartodb_id":2,"address":"ewTKpIBFTmG"},...]
  #     }
  def addresses
    response = @table.run_query("select cartodb_id, #{@table.address_column} from #{@table.name}")
    render :json => response.to_json, :status => 200, :callback => params[:callback]
  end


  # Update the geometry values from a row
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/:id/update_geometry/:row_id
  # * Format: +JSON+
  # * Parameters for setting lat and lon columns new values:
  #     {
  #       "lat" => "<new lat value>",
  #       "lon" => "<new lon value>"
  #     }
  # * Parameters for setting address_column new value:
  #     {
  #       "address" => "<new address value>"
  #     }
  # * Response if _success_:
  #   * status code: 200
  #   * body: _nothing_
  def update_geometry
    @table.update_geometry!(params[:row_id], params.slice(:lat, :lon, :address))
    render :json => ''.to_json,
           :callback => params[:callback], :status => 200
  end

  protected

  def load_table
    @table = Table.fetch("select user_tables.id,user_tables.user_id,user_tables.name,user_tables.privacy,user_tables.geometry_columns,
                            array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id order by tags.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ? and user_tables.name = ?", current_user.id, params[:id]).all.first
    raise RecordNotFound if @table.nil?
  end

end