module CartoDB
  module Import
    class XLS < CartoDB::Import::Preprocessor

      register_preprocessor :xls
      register_preprocessor :xlsx
      register_preprocessor :ods

      def process!
        @data_import = DataImport.find(:id=>@data_import_id)
        new_path = "/tmp/#{@working_data[:suggested_name]}.csv"
        import_data = Array.new
        begin
          case @working_data[:ext]
            when '.xls'
              Excel.new(@working_data[:path])
            when '.xlsx'
              Excelx.new(@working_data[:path])
            when '.ods'
              Openoffice.new(@working_data[:path])
            else
              @data_import.set_error_code(5000)
              @data_import.log_error("ERROR: unable to open spreadsheet #{@working_data[:path]}")
              @runlog.log << "Don't know how to open spreadsheet #{@working_data[:path]}"
              raise ArgumentError, "Don't know how to open spreadsheet #{@working_data[:path]}"
          end.to_csv(new_path)
        
          @import_from_file = File.open(new_path,'r')
          import_data << {
            :ext => '.csv',
            :suggested_name => @working_data[:suggested_name].sanitize,
            :path => @import_from_file.path
          }
          
        rescue
          @data_import.set_error_code(5000)
          @data_import.log_error("ERROR: unable to open spreadsheet #{@working_data[:path]}")
          @runlog.log << "Don't know how to open spreadsheet #{@working_data[:path]}"
        end
        # construct return variables
        import_data        
      end  
    end
  end    
end