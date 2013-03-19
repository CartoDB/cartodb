# encoding: utf-8
require 'tempfile'
require 'iconv'

module CartoDB
  class UNP
    attr_accessor :data_import, :path, :suggested_name, :tmp_dir, :iconv

    def initialize(arguments)
      @path           = arguments.fetch(:path)
      @suggested_name = arguments.fetch(:suggested_name)
      @data_import    = arguments.fetch(:data_import)
      @iconv          = Iconv.new('UTF-8//IGNORE', 'UTF-8')
      tempfile        = Tempfile.new("")
      @tmp_dir        = tempfile.path
      tempfile.close!
    end #initialize

    def process!
      data_import.log_update("untar file #{path}")
      import_data     = []

      Dir.mkdir(tmp_dir)
      curdir  = Dir.pwd
      Dir.chdir(tmp_dir)
      tarcmd  = "unp #{path}"
      utr     = `#{tarcmd}`

      # Try to detect unp failures
      if utr =~ /.*Cannot read.*/ || $?.exitstatus != 0
        data_import.log_update("unp: Can't find #{path}")
        raise "unp: Can't find #{path}"
      end
      Dir.chdir(curdir)


      files = Array.new
      # create a list of all files in the directory and
      # any directories one level below. I was running into issues
      # of files being created in a dir, so not getting processed.
      # this fixes
      # uses Iconv to remove illegal characters from any directory/file
      # names that are created by unp

      Dir.foreach(tmp_dir) do |name|
        # temporary filename. no collisions.
        tmp_path = "#{tmp_dir}/#{name}"
        if File.file?(tmp_path)
          if tmp_path != iconv.iconv(tmp_path)
            File.rename( tmp_path, iconv.iconv(tmp_path) )
            tmp_path = iconv.iconv(tmp_path)
          end
          files << tmp_path
        elsif File.directory?(tmp_path)
          unless ['.','..','__MACOSX'].include?(name)
            if tmp_path != iconv.iconv(tmp_path)
              File.rename( tmp_path, iconv.iconv(tmp_path) )
              tmp_path = iconv.iconv(tmp_path)
            end
            Dir.foreach(tmp_path) do |subname|
              unless ['.','..','__MACOSX',nil].include?(subname)
                if subname != iconv.iconv(subname)

                  File.rename( "#{tmp_path}/#{subname}", "#{tmp_path}/#{iconv.iconv(subname)}"  )
                  subname = iconv.iconv(subname)
                end
                tmp_sub = "#{tmp_path}/#{subname}"
                if File.file?(tmp_sub)
                  files << tmp_sub
                end
              end
            end # foreach
          end # unless
        end # elsif
      end # foreach

      # now with the list of potential files
      # find out if we have a winner
      files.each do |tmp_path|
        if File.file?(tmp_path)
          dirname = File.dirname(tmp_path)
          name    = File.basename(tmp_path).downcase

          next if name =~ /^(\.|\_{2})/
          name = name.gsub(' ','_') if name.include? ' '

          #fixes problem of different SHP archive files with different case patterns
          unless File.basename(tmp_path) == name.downcase
            FileUtils.mv("#{tmp_path}", "#{dirname}/#{name.downcase}", :force => true) 
          end

          name = name
          if CartoDB::Importer::SUPPORTED_FORMATS.include?(File.extname(name))
            import_data << {
              ext:            File.extname(name),
              suggested_name: name_from(name, suggested_name),
              path:            "#{dirname}/#{name}"
            }
          end
        end
      end

      # construct return variables
      import_data
    end

    private

    def name_from(name, suggested_name=nil )
      return suggested_name unless suggested_name.nil?
      File.basename(name, File.extname(name)).sanitize
    end #name_from
  end # UNP
end # CartoDB

