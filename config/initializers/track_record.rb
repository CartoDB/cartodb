# encoding: utf-8
require_relative './redis'
require_relative '../../services/data-repository/repository'
require_relative '../../services/track_record/track_record'

TrackRecord::Log.repository = DataRepository.new($redis_migrator_logs)

