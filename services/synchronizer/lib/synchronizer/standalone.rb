# encoding: utf-8
require_relative './runner'

CartoDB::Synchronizer::Runner.new(
  CartoDB::Synchronizer::Collection.new,
  tick_time_in_secs: 600
).run

