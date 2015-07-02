# encoding: utf-8

module CartoDB
  class HiresGeocoderFactory

    BATCH_FILES_OVER = 1100 # Use Here Batch Geocoder API with tables over x rows

    def self.get(input_csv_file, working_dir)
      # TODO: read the following arguments from config
      # app_id:             arguments[:app_id],
      # token:              arguments[:token],
      # mailto:             arguments[:mailto],
      # request_id:         arguments[:remote_id],
      # base_url:           arguments[:base_url],
      # non_batch_base_url: arguments[:non_batch_base_url]

      geocoder_class = nil
      if use_batch_process?
        geocoder_class = HiresBatchGeocoder
      else
        geocoder_class = HiresGeocoder
      end

      geocoder_class.new(input_csv_file, workding_dir)
    end


    private

    def self.use_batch_process?
      input_rows > BATCH_FILES_OVER
    end

    def self.input_rows
      stdout, stderr, status  = Open3.capture3('wc', '-l', input_file)
      stdout.to_i
    rescue => e
      CartoDB.notify_exception(e)
      0
    end

  end
end
