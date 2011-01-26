class Api::Json::TablesController < ApplicationController

  before_filter :login_required
  before_filter :load_table, :except => [:index]

  # Get the list of tables of a user
  # * Request Method: +GET+
  # * URI: +/api/json/tables+
  # * Format: +JSON+
  # * Response:
  #     [
  #       {
  #         "id" => 1,
  #         "name" => "My table",
  #         "privacy" => "PUBLIC"
  #       },
  #       {
  #         "id" => 2,
  #         "name" => "My private data",
  #         "privacy" => "PRIVATE"
  #       }
  #     ]
  def index
    @tables = Table.select(:id,:user_id,:name,:privacy).all
    respond_to do |format|
      format.json do
        render :json => @tables.map{ |table| {:id => table.id, :name => table.name, :privacy => table_privacy_text(table)} }.to_json
      end
    end
  end

  # Gets the rows from a table
  # * Request Method: +GET+
  # * URI: +/api/json/tables/1+
  # * Params:
  #   * +rows_per_page+: number of rows in the response. By default +10+
  #   * +page+: number of the current page. By default +0+
  # * Format: +JSON+
  # * Response:
  #     {
  #       "total_rows" => 100,
  #       "columns" => [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"]],
  #       "rows" => [{:id=>1, :name=>"name 1", :location=>"...", :description=>"description 1"}]
  #     }
  def show
    respond_to do |format|
      format.json do
        render :json => @table.to_json(:rows_per_page => params[:rows_per_page], :page => params[:page])
      end
    end
  end

  # Gets the scehma from a table
  #
  # * Request Method: +GET+
  # * URI: +/api/json/tables/1/schema+
  # * Format: +JSON+
  # * Response:
  #     [[:id, "integer"], [:name, "text"], [:location, "geometry"], [:description, "text"]]
  def schema
    respond_to do |format|
      format.json do
        render :json => @table.schema.to_json
      end
    end
  end

  # Toggle the privacy of a table. Returns the new privacy status
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/1/toggle_privacy+
  # * Format: +JSON+
  # * Response:
  #     { "privacy" => "PUBLIC" }
  def toggle_privacy
    @table.toggle_privacy!
    respond_to do |format|
      format.json do
        render :json => { :privacy => table_privacy_text(@table) }.to_json
      end
    end
  end

  # Update a table
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/1/update+
  # * Format: +JSON+
  # * Parameters: a hash with keys representing the attributes and values with the new values for that attributes
  #     {
  #       "tags" => "new tag #1, new tag #2",
  #       "name" => "new name"
  #     }
  # * Response if _success_:
  #   * status code: 200
  #   * body: _nothing_
  # * Response if _error_:
  #   * status code +400+
  #   * body:
  #       { "errors" => ["error #1", "error #2"] }
  def update
    respond_to do |format|
      format.json do
        begin
          @table.update_all(params)
          render :nothing => true, :status => 200
        rescue
          render :json => { :errors => @table.errors.full_messages}.to_json, :status => 400
        end
      end
    end
  end

  # Update the schema of a table
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/1/update_schema+
  # * Format: +JSON+
  # * Parameters:
  #     {
  #       "what" => "add" or "drop",
  #       "column" => {
  #          "name" => "new column name",
  #          "type" => "integer"
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
                @table.add_column!(params[:column])
              elsif params[:what] == 'drop'
                @table.drop_column!(params[:column])
              else
                @table.modify_column!(params[:column])
              end
              render :nothing => true, :status => 200
            rescue => e
              render :json => { :errors => [e.message.split("\n").first] }.to_json, :status => 400 and return
            end
          else
            render :json => { :errors => ["column parameter can't be blank"] }.to_json, :status => 400 and return
          end
        else
          render :json => { :errors => ["what parameter has an invalid value"] }.to_json, :status => 400 and return
        end
      end
    end
  end

  # Insert a new row in a table
  # * Request Method: +POST+
  # * URI: +/api/json/tables/1/rows+
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
    @table.insert_row!(params)
    respond_to do |format|
      format.json do
        render :nothing => true, :status => 200
      end
    end
  end

  # Insert a new row in a table
  # * Request Method: +PUT+
  # * URI: +/api/json/tables/1/rows/33+
  # * Format: +JSON+
  # * Parameters:
  #     {
  #       "row_id" => "3",
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
          if resp = @table.update_row!(params[:row_id], params)
            render :nothing => true, :status => 200
          else
            case resp
              when 404
                render :json => { :errors => ["row with id = #{params[:row_id]} not found"] }.to_json, :status => 400 and return
            end
          end
        else
          render :json => { :errors => ["row_id can't be blank"] }.to_json, :status => 400 and return
        end
      end
    end
  end

  protected

  def load_table
    @table = Table.select(:id,:user_id,:name,:privacy).filter(:id => params[:id]).first
    raise ActiveRecord::RecordNotFound if @table.user_id != current_user.id && @table.private?
  end

end