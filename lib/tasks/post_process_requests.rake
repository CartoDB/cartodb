namespace :cartodb do
  namespace :log do
    desc "Take an input with the format 'verb,request,respnse_time' and outputs 'verb,controller,action,response_time'"
    task :post_process_requests, [:input_file] => :environment do |_task, args|
      input_file = args[:input_file]
      if input_file.nil?
        raise "Error: need to provide an input file. E.g: rake cartodb:log:post_process_requests['input_file.csv']"
      end

      routes = Rails.application.routes
      CSV.foreach(input_file) do |row|
        verb, request, response_time = row
        uri = URI.parse(request)
        r = begin
              routes.recognize_path(uri.path, method: verb)
            rescue StandardError
              next
            end
        controller = r[:controller]
        action = r[:action]
        puts "#{verb},#{controller},#{action},#{response_time}"
      end
    end
  end
end
