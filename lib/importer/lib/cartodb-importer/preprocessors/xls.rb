# encoding: utf-8

module CartoDB
  class XLS
    EXTENSIONS = %w{ .xls .xlsx .ods }

    def initialize(arguments={})
      @working_data     = arguments.fetch(:working_data)
      @origin_path      = @working_data.fetch(:path)
      @extension        = @working_data.fetch(:ext)
      @suggested_name   = @working_data.fetch(:suggested_name).sanitize
      @destination_path = "/tmp/#{@suggested_name}.csv"
      @data_import      = arguments.fetch(:data_import)
    end #initialize

    def process!
      raise unless EXTENSIONS.include?(extension)
      preprocessor_for(extension).to_csv(destination_path)

      [{
        ext:            '.csv',
        import_type:    extension,
        suggested_name: suggested_name,
        path:           destination_path
      }]
    rescue => exception
      log_error_and_raise
    end #process! 

    private

    attr_accessor :working_data, :origin_path, :extension, :suggested_name,
                  :destination_path, :import_data, :data_import

    def preprocessor_for(extension)
      send(extension.delete('.'))
    end #preprocessor_for

    def xls
      fix_carriage_returns_in_headers( Excel.new(origin_path) )
    end #xls

    def xlsx
      fix_carriage_returns_in_headers( Excelx.new(origin_path) )
    end #xlsx

    def ods
      Openoffice.new(origin_path)
    end #ods

    def fix_carriage_returns_in_headers(data)
      g = Array.new
      data.row(1).each{ |cell| g << cell.gsub('\n', '').strip }

      if data.row(1) != g
        cell_count = 1

        g.each do |cell|
          data.set(1, cell_count, cell)
          cell_count = cell_count + 1
        end
      end

      data
    end

    def error_message
      "ERROR: unable to open spreadsheet #{origin_path}"
    end #error_message

    def log_error_and_raise
      data_import.set_error_code(5000)
      data_import.log_error(error_message)
      raise ArgumentError, error_message
    end #log_error_and_raise
  end # XLS
end # CartoDB

