# encoding: utf-8
require_relative './runner'

CartoDB::AutomaticGeocoder::Runner.new(tick_time_in_secs: 600).run
