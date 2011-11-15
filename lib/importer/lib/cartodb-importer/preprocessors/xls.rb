module CartoDB
  module Import
    class XLS < CartoDB::Import::Preprocessor

      register_preprocessor :xls
      register_preprocessor :xlsx
      register_preprocessor :ods

      def process!
        new_path = "/tmp/#{@suggested_name}.csv"
        case @ext
          when '.xls'
            Excel.new(@path)
          when '.xlsx'
            Excelx.new(@path)
          when '.ods'
            Openoffice.new(@path)
          else
            @runlog.log << "Don't know how to open file #{new_path}"
            raise ArgumentError, "Don't know how to open file #{new_path}"
        end.to_csv(new_path)
        
        @import_from_file = File.open(new_path,'r')
        @ext = '.csv'
        @path = @import_from_file.path
        
        # construct return variables
        to_import_hash        
      end  
    end
  end    
end