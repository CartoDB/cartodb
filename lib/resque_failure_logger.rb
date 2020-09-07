# TODO: move to Carto::Common::JobLogger

class ResqueFailureLogger < Resque::Failure::Base

  include ::LoggerHelper

  def save
    log_error(
      message: 'Job failed',
      component: 'cartodb.resque',
      exception: exception,
      worker: { pid: worker.pid, hostname: worker.hostname },
      job_class: payload['class'],
      args: payload['args'].inspect,
      run_at: worker.job["run_at"]
    )
  end

end
