# frozen_string_literal:true

class SolutionsController < ApplicationController
  skip_forgery_protection # TODO: too easy to artificially create solution by sending requests...

  def create
    solution = Solution.create!(pattern_id: params[:pattern_id])
    params[:polygons].each do |polygon|
      solution.polygons.create!(
        shape: polygon[:shape].underscore,
        points: polygon[:points]
      )
    end
  end
end
