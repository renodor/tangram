# frozen_string_literal:true

Rails.application.routes.draw do
  # Needed for kamal
  get 'up' => 'rails/health#show', as: :rails_health_check

  devise_for :users
  get '/sign_in_demo_user', to: 'game#sign_in_demo_user'

  root 'game#play'

  resources :patterns, only: :show do
    member do
      get :filled_svg
      get :revealed_svg
    end
  end

  resources :solved_patterns, only: :create
  resources :solutions, only: :create
end
