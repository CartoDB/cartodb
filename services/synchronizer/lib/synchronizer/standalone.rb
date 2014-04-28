# encoding: utf-8
require_relative './runner'

puts 'Starting Synchronizer::Runner...'

CartoDB::Synchronizer::Runner.new(
  CartoDB::Synchronizer::Collection.new,
  tick_time_in_secs: ENV['SYNC_TICK_TIME'] || 600
).run

puts 'Synchronizer::Runner is started'
