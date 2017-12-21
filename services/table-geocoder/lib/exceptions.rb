# encoding: utf-8

require 'active_support/core_ext/string'

module Carto
  module GeocoderErrors

    GEOCODER_TIMED_OUT_TITLE = 'The geocoder timed out'
    GEOCODER_TIMED_OUT_WHAT_ABOUT = %q{
      Your geocoding request timed out.
      Please <a href='mailto:support@cartob.com?subject=The geocoder timed out'>contact us</a>
      and we'll try to fix it quickly.
    }.squish

    class AdditionalInfo
      SOURCE_CARTODB = 'cartodb'
      SOURCE_USER = 'user'

      attr_accessor :error_code, :title, :what_about, :source

      def initialize(error_code, title, what_about, source)
        self.error_code = error_code
        self.title = title
        self.what_about = what_about
        self.source = source
      end
    end

    class GeocoderBaseError < StandardError
      @@error_code_info_map = {}

      attr_reader :original_exception

      def initialize(original_exception=nil)
        message = self.class.to_s
        if original_exception
          message << " " << original_exception.message
          @original_exception = original_exception
        end
        super(message) # this is the only way of setting the message
        set_backtrace(original_exception.backtrace) if original_exception # this line must appear after calling super
      end

      def original_message
        @original_exception.message if @original_exception
      end

      def self.register_additional_info(error_code, title, what_about, source)
        raise 'Duplicate error code' if @@error_code_info_map.has_key?(error_code)
        @additional_info = AdditionalInfo.new(error_code, title, what_about, source)
        @@error_code_info_map[@additional_info.error_code] = @additional_info
      end

      def self.get_info(error_code)
        @@error_code_info_map[error_code]
      end

      class << self
        attr_reader :additional_info
      end
    end

    # just a convenience
    def self.additional_info(error_code)
      GeocoderBaseError.get_info(error_code)
    end



    class MisconfiguredGmeGeocoderError < GeocoderBaseError
      register_additional_info(
        1000,
        'Google for Work account misconfigured',
        %q{Your Google for Work account seems to be incorrectly configured.
           Please <a href='mailto:sales@cartob.com?subject=Google for Work account misconfigured'>contact us</a>
           and we'll try to fix it quickly.}.squish,
        AdditionalInfo::SOURCE_USER
        )
    end

    class GmeGeocoderTimeoutError < GeocoderBaseError
      register_additional_info(
        1010,
        'Google geocoder timed out',
        %q{Your geocoding request timed out after several attempts.
           Please check your quota usage in the <a href='https://console.developers.google.com/'>Google Developers Console</a>
           and <a href='mailto:support@carto.com?subject=Google geocoder timed out'>contact us</a>
           if you are within the usage limits.}.squish,
        AdditionalInfo::SOURCE_USER
        )
    end

    class AddGeorefStatusColumnDbTimeoutError < GeocoderBaseError
      register_additional_info(
        1020,
        GEOCODER_TIMED_OUT_TITLE,
        GEOCODER_TIMED_OUT_WHAT_ABOUT,
        AdditionalInfo::SOURCE_CARTODB
        )
    end

    class GeocoderCacheDbTimeoutError < GeocoderBaseError
      register_additional_info(
        1030,
        GEOCODER_TIMED_OUT_TITLE,
        GEOCODER_TIMED_OUT_WHAT_ABOUT,
        AdditionalInfo::SOURCE_CARTODB
        )
    end

    class TableGeocoderDbTimeoutError < GeocoderBaseError
      register_additional_info(
        1040,
        GEOCODER_TIMED_OUT_TITLE,
        GEOCODER_TIMED_OUT_WHAT_ABOUT,
        AdditionalInfo::SOURCE_CARTODB
        )
    end

  end
end
