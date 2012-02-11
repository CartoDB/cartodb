# Methods taken from the Sequel library to normalise ruby-pg output to Ruby types
# /lib/sequel/adaptors/postgres.rb

module CartoDB
  module MiniSequel
        
    def output_identifier(v)
      v = 'untitled' if v == ''
      v.to_sym
    end

    def fetch_rows_set_cols(res, translation_proc)
      cols = []
      procs = translation_proc
      res.nfields.times do |fieldnum|
        cols << [fieldnum, procs[res.ftype(fieldnum)], output_identifier(res.fname(fieldnum))]
      end
      @columns = cols.map{|c| c.at(2)}
      cols
    end

    def yield_hash_rows(res, cols)
      res.ntuples.times do |recnum|
        converted_rec = {}
        cols.each do |fieldnum, type_proc, fieldsym|
          value = res.getvalue(recnum, fieldnum)
          converted_rec[fieldsym] = (value && type_proc) ? type_proc.call(value) : value
        end
        yield converted_rec
      end
    end
    
    def pg_to_hash(res, translation_proc)
      rows = []
      yield_hash_rows(res,fetch_rows_set_cols(res,translation_proc)) {|row| row.delete("the_geom"); rows << row}
      rows      
    end
    
    def pg_results? res
      res.result_status == PGresult::PGRES_TUPLES_OK
    end
    
    def pg_modified? res
      res.result_status == PGresult::PGRES_COMMAND_OK
    end
    
    def pg_size res
      res.cmd_tuples
    end          
  end
end