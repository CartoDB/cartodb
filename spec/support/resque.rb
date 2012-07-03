Resque.inline = true

module CartoDB
  class Resque
    def self.perform_jobs_from_queue(queue)
      job = ::Resque::Job.reserve(queue)
      klass = ::Resque::Job.constantize(job.payload['class'])
      klass.perform(*job.payload['args'])
    end
  end
end
