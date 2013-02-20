# encoding: utf-8

module Workman
  module Job
    class StateMachine
      STATES            = %w{ queued running success failure aborted }
      ENTRY_STATE       = 'queued'
      MESSAGE_TEMPLATE  = "Job {job_id} changed to '{state}'"


      def initialize(job_id, log=TrackRecord::Log.new)
        @job_id = job_id
        @log    = log
      end #initialize

      def transition(arguments)
        next_state = arguments.fetch(:next_state)
        log.append entry_for(job_id, next_state)
        next_state
      end #transition

      private

      attr_reader :job_id, :log

      def entry_for(job_id, state)
        { job_id: job_id, message: message_for(job_id, state) }
      end #entry_for

      def message_for(job_id, state)
        MESSAGE_TEMPLATE.dup
          .gsub(/{job_id}/, job_id)
          .gsub(/{state}/, state.to_s)
      end #message_for
    end # StateMachine
  end # Job
end # Workman

