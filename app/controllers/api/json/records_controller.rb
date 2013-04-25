# coding: UTF-8
class Api::Json::RecordsController < Api::ApplicationController
  ssl_required :index, :create, :show, :update, :destroy, :show_column, :update_column, :pending_addresses

  REJECT_PARAMS = %W{ format controller action id row_id requestId column_id api_key table_id oauth_token oauth_token_secret }

  before_filter :load_table, :set_start_time

  def index
    render_jsonp(Yajl::Encoder.encode(@table.records(params.slice(:page, :rows_per_page, :order_by, :mode, :filter_column, :filter_value))))
  rescue => e
    CartoDB::Logger.info "exception on records#index", e.inspect
    render_jsonp({ :errors => [e] }, 400)
  end

  def create
    primary_key = @table.insert_row!(params.reject{|k,v| REJECT_PARAMS.include?(k)}.symbolize_keys)
    render_jsonp(get_record(primary_key))
  rescue => e
    render_jsonp({ :errors => [e.message] }, 400)
  end

  def show
    render_jsonp(get_record(params[:id]))
  rescue => e
    render_jsonp({ :errors => ["Record #{params[:id]} not found"] }, 404)
  end

  def update
    unless params[:id].blank?
      begin
        resp = @table.update_row!(params[:id], params.reject{|k,v| REJECT_PARAMS.include?(k)}.symbolize_keys)
        if resp > 0
          render_jsonp(get_record(params[:id]))
        else
          render_jsonp({ :errors => ["row identified with #{params[:id]} not found"] }, 404) and return
        end
      rescue => e
        CartoDB::Logger.info e.backtrace.join('\n')
        render_jsonp({ :errors => [translate_error(e.message.split("\n").first)] }, 400) and return
      end
    else
      render_jsonp({ :errors => ["id can't be blank"] }, 404) and return
    end
  end

  def destroy
    if params[:id]
      current_user.in_database do |user_database|
        if params[:id] =~ /^\d+$/
          user_database.run("delete from #{@table.name} where cartodb_id = #{params[:id].sanitize_sql}")
        else
          params[:id].split(',').each do |raw_id|
            user_database.run("delete from #{@table.name} where cartodb_id = #{raw_id.sanitize_sql}")
          end
        end
      end
      head :no_content
    else
      render_jsonp({ :errors => ["row identified with #{params[:id]} not found"] }, 404) and return
    end
  end

  def show_column
    render_jsonp(current_user.run_query("select #{params[:id].sanitize_sql} from #{@table.name} where cartodb_id = #{params[:record_id].sanitize_sql}")[:rows].first)
  end

  def update_column
    @table.update_row!(params[:record_id], {params[:id].to_sym => params[:value]})
    render_jsonp({ params[:id] => params[:value] })
  end

  def pending_addresses
    records = @table.get_records_with_pending_addresses(:page => params[:page], :rows_per_page => params[:rows_per_page])
    render_jsonp(records)
  end

  protected

  def get_record(id)
    @table.record(id)
  end

  def load_table
    @table = Table.find_by_identifier(current_user.id, params[:table_id])
    raise RecordNotFound if @table.nil?
  end
end
