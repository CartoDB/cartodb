
module Carto
  module Api
    class SynchronizationPresenter

      def initialize(synchronization)
        @synchronization = synchronization
      end

      def to_poro
        return nil if @synchronization.nil?

        {
          checksum:         @synchronization.checksum,
          created_at:       @synchronization.created_at,
          error_code:       @synchronization.error_code,
          error_message:    @synchronization.error_message,
          id:               @synchronization.id,
          interval:         @synchronization.interval,
          modified_at:      @synchronization.modified_at,
          name:             @synchronization.name,
          ran_at:           @synchronization.ran_at,
          retried_times:    @synchronization.retried_times,
          run_at:           @synchronization.run_at,
          service_item_id:  @synchronization.service_item_id,
          service_name:     @synchronization.service_name,
          state:            @synchronization.state,
          updated_at:       @synchronization.updated_at,
          url:              @synchronization.url,
          user_id:          @synchronization.user_id,
          content_guessing: @synchronization.content_guessing,
          etag:             @synchronization.etag,
          log_id:           @synchronization.log_id,
          quoted_fields_guessing: @synchronization.quoted_fields_guessing,
          type_guessing:    @synchronization.type_guessing,
          from_external_source: @synchronization.from_external_source?
        }
      end

    end
  end
end
