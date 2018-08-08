Resque.schedule = {
  'Resque::UserJobs::RateLimitsJobs::SyncRedis' => {
    every: '2s',
    queue: 'users',
    args: ['FREE']
  }
}
