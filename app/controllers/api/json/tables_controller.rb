# coding: UTF-8

class Api::Json::TablesController < ApplicationController
  ssl_required :index, :show, :create, :query, :schema, :toggle_privacy, :update, :update_schema, :create_row, :update_row,
               :delete, :set_geometry_columns, :get_address_column, :addresses, :delete_row, :update_geometry


  REJECT_PARAMS = %W{ format controller action id row_id requestId column_id api_key}

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


  # Update the schema of a table
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/:id/update_schema+
  # * Format: +JSON+
  # * Parameters for adding or removing a column:
  #     {
  #       "what" => ("add"|"drop")
  #       "column" => {
  #          "name" => "new column name",
  #          "type" => "type"
  #       }
  #     }
  # * Parameters for modifying a column:
  #     {
  #       "what" => "modify"
  #       "column" => {
  #          "old_name" => "old column name"
  #          "new_name" => "new column name",
  #          "type" => "the new type"
  #       }
  #     }
  # * Response if _success_:
  #   * status code: 200
  #   * body: _nothing_
  # * Response if _error_:
  #   * status code +400+
  #   * body:
  #       { "errors" => ["error message"] }
  def update_schema
    respond_to do |format|
      format.json do
        if params[:what] && %W{ add drop modify }.include?(params[:what])
          unless params[:column].blank? || params[:column].empty?
            begin
              if params[:what] == 'add'
                resp = @table.add_column!(params[:column])
                render :json => resp.to_json, :status => 200, :callback => params[:callback] and return
              elsif params[:what] == 'drop'
                @table.drop_column!(params[:column])
                render :json => ''.to_json, :status => 200, :callback => params[:callback] and return
              else
                resp = @table.modify_column!(params[:column])
                render :json => resp.to_json, :status => 200, :callback => params[:callback] and return
              end
            rescue => e
              errors = if e.is_a?(CartoDB::InvalidType)
                [e.db_message]
              else
                [translate_error(e.message.split("\n").first)]
              end
              render :json => { :errors => errors }.to_json, :status => 400,
                     :callback => params[:callback] and return
            end
          else
            render :json => { :errors => ["column parameter can't be blank"] }.to_json, :status => 400,
                   :callback => params[:callback] and return
          end
        else
          render :json => { :errors => ["what parameter has an invalid value"] }.to_json, :status => 400,
                 :callback => params[:callback] and return
        end
      end
    end
  end

  # Insert a new row in a table
  # * Request Method: +POST+
  # * URI: +/api/json/tables/:id/rows+
  # * Format: +JSON+
  # * Parameters:
  #     {
  #       "column_name1" => "value1",
  #       "column_name2" => "value2"
  #     }
  # * Response if _success_:
  #   * status code: 200
  #   * body: _nothing_
  # * Response if _error_:
  #   * status code +400+
  #   * body:
  #       { "errors" => ["error message"] }
  def create_row
    primary_key = @table.insert_row!(params.reject{|k,v| REJECT_PARAMS.include?(k)})
    respond_to do |format|
      format.json do
        render :json => {:id => primary_key}.to_json, :status => 200, :callback => params[:callback]
      end
    end
  rescue => e
    render :json => { :errors => [e.error_message] }.to_json, :status => 400,
           :callback => params[:callback] and return
  end

  # Insert a new row in a table
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/:id/rows/:row_id+
  # * Format: +JSON+
  # * Parameters:
  #     {
  #       "column_name" => "new value"
  #     }
  # * Response if _success_:
  #   * status code: 200
  #   * body: _nothing_
  # * Response if _error_:
  #   * status code +400+
  #   * body:
  #       { "errors" => ["error message"] }
  def update_row
    respond_to do |format|
      format.json do
        unless params[:row_id].blank?
          begin
            if resp = @table.update_row!(params[:row_id], params.reject{|k,v| REJECT_PARAMS.include?(k)})
              render :json => ''.to_json, :status => 200
            else
              case resp
                when 404
                  render :json => { :errors => ["row identified with #{params[:row_id]} not found"] }.to_json,
                         :status => 400, :callback => params[:callback] and return
              end
            end
          rescue => e
            render :json => { :errors => [translate_error(e.message.split("\n").first)] }.to_json, :status => 400,
                   :callback => params[:callback] and return
          end
        else
          render :json => { :errors => ["row_id can't be blank"] }.to_json,
                 :status => 400, :callback => params[:callback] and return
        end
      end
    end
  end


  # Set the columns of the geometry of the table
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/:id/set_geometry_columns
  # * Format: +JSON+
  # * Parameters for setting lat and lon columns:
  #     {
  #       "lat_column" => "<lat_column_name>",
  #       "lon_column" => "<lon_column_name>"
  #     }
  # * Parameters for setting an address column:
  #     {
  #       "address_column" => "<address_column_name>"
  #     }
  # * Response if _success_:
  #   * status code: 200
  # * Response if _error_:
  #   * status code +400+
  #   * body:
  #       { "errors" => ["error message"] }
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

  # Drop a row from a table
  # * Request Method: +DELETE+
  # * URI: +/api/json/tables/:id/rows/:row_id
  # * Format: +JSON+
  # * Response if _success_:
  #   * status code: 200
  #   * body: _nothing_
  def delete_row
    if params[:row_id]
      current_user.in_database do |user_database|
        user_database.run("delete from #{@table.name} where cartodb_id = #{params[:row_id].sanitize_sql!}")
      end
      render :json => ''.to_json,
             :callback => params[:callback], :status => 200
    else
      render :json => {:errros => ["Invalid parameters"]}.to_json,
             :status => 404, :callback => params[:callback] and return
    end
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
                            array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ? and user_tables.name = ?", current_user.id, params[:id]).all.first
    raise RecordNotFound if @table.nil?
  end

end