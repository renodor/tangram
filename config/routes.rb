# frozen_string_literal:true

Rails.application.routes.draw do
  devise_for :users

  root 'game#play'

  resources :patterns do
    member do
      get :points_by_polygons_shape
      get :revealed_svg
    end
  end

  resources :solved_patterns, only: :create
end
