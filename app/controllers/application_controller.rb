# frozen_string_literal:true

class ApplicationController < ActionController::Base
  # Overwriting the sign_out redirect path method
  def after_sign_out_path_for(_resource_or_scope)
    new_user_session_path
  end
end
