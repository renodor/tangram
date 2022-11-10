# frozen_string_literal:true

Rails.application.routes.draw do
  devise_for :users

  root 'game#play'

  resources :patterns, only: :show
  resources :solved_patterns, only: :create
end
