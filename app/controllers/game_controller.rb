# frozen_string_literal:true

class GameController < ApplicationController
  before_action :authenticate_user!, except: :sign_in_demo_user

  def play
    @patterns = Pattern.ordered
    @current_pattern = @patterns.sample
    @textures = Polygon.shapes.keys.each_with_object({}) do |shape, hash|
      camelized_name = shape.camelize(:lower)
      hash[camelized_name] = helpers.image_path("textures/#{camelized_name}.jpg")
    end

    user_is_demo_user = current_user == User.demo_user
    @first_time_login = user_is_demo_user || current_user.first_time_login
    current_user.update!(first_time_login: false) if current_user.first_time_login && !user_is_demo_user

    flash.delete(:notice)
  end

  def sign_in_demo_user
    sign_in User.demo_user
    redirect_to root_path
  end
end
