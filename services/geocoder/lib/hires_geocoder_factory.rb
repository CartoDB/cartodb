# encoding: utf-8

require_relative 'hires_geocoder'
require_relative 'hires_batch_geocoder'
require_relative 'geocoder_config'


module CartoDB
  class HiresGeocoderFactory

    BATCH_FILES_OVER = 1100 # Use Here Batch Geocoder API with tables over x rows

    def self.get(input_csv_file, working_dir, log)
      geocoder_class = nil
      if use_batch_process? input_csv_file
        geocoder_class = HiresBatchGeocoder
      else
        geocoder_class = HiresGeocoder
      end

      geocoder_class.new(input_csv_file, working_dir, log)
    end


    private

    def self.use_batch_process? input_csv_file
      force_batch? || input_rows(input_csv_file) > BATCH_FILES_OVER
    end

    def self.force_batch?
      GeocoderConfig.instance.get['force_batch'] || false
    end

    def self.input_rows(input_csv_file)
      stdout, stderr, status  = Open3.capture3('wc', '-l', input_csv_file)
      stdout.to_i
    rescue => e
      CartoDB.notify_exception(e)
      0
    end

  end
end
