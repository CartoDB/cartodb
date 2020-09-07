require_relative 'hires_geocoder'
require_relative 'hires_batch_geocoder'
require_relative 'geocoder_config'


module CartoDB
  class HiresGeocoderFactory

    BATCH_FILES_OVER = 1100 # Use Here Batch Geocoder API with tables over x rows

    def self.get(input_csv_file, working_dir, log, geocoding_model, number_of_rows = 0)
      geocoder_class = nil
      if use_batch_process?(input_csv_file, geocoding_model, number_of_rows)
        geocoder_class = HiresBatchGeocoder
      else
        geocoder_class = HiresGeocoder
      end

      geocoder_class.new(input_csv_file, working_dir, log, geocoding_model)
    end


    private

    def self.use_batch_process?(input_csv_file, geocoding_model, number_of_rows)
      # Due we could check this condition to create the geocoder class and we don't
      # have finished yet the csv file generation, and could be nil, we have to check
      # multiples conditions. It's sorted by priority
      if force_batch? || geocoding_model.batched
        true
      elsif (not input_csv_file.nil?) && (input_rows(input_csv_file) > BATCH_FILES_OVER)
        true
      elsif (not number_of_rows.nil?) && (number_of_rows > BATCH_FILES_OVER)
        true
      else
        false
      end
    end

    def self.force_batch?
      GeocoderConfig.instance.get['force_batch'] || false
    end

    def self.input_rows(input_csv_file)
      stdout, _stderr, _status = Open3.capture3('wc', '-l', input_csv_file)
      stdout.to_i
    rescue StandardError => e
      CartoDB.notify_exception(e)
      0
    end

  end
end
