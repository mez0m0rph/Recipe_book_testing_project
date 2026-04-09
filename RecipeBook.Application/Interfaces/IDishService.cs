using RecipeBook.Domain.Entities;
using RecipeBook.Domain.Enums;

namespace RecipeBook.Application.Interfaces;

public interface IDishService
{
    Task<List<Dish>> GetAllAsync(
        string? search,
        DishCategory? category,
        Flags? flags);

    Task<Dish?> GetByIdAsync(Guid id);
    Task<Dish> CreateAsync(Dish dish);
    Task<Dish> UpdateAsync(Dish dish);
    Task DeleteAsync(Guid id);
}