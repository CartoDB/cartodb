namespace :cartodb do
  namespace :log do
    desc "Take an input with the format 'verb,request,respnse_time' and outputs 'verb,controller,action,response_time'"
    task :post_process_requests, [:input_file] => :environment do |task, args|
      input_file = args[:input_file]
      raise "Error: need to provide an input file. E.g: rake cartodb:log:post_process_requests['input_file.csv']" if input_file.nil?

      routes = Rails.application.routes
      CSV.foreach(input_file) do |row|
        verb, request, response_time = row
        uri = URI.parse(request)
        r = routes.recognize_path(uri.path, method: verb) rescue next
        controller = r[:controller]
        action = r[:action]
        puts "#{verb},#{controller},#{action},#{response_time}"
      end
    end
  end
end
