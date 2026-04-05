using RecipeBook.Domain.Entities;

namespace RecipeBook.Application.Interfaces;

public interface IDishService
{
    Task<Dish> CreateAsync(Dish dish);
    Task<List<Dish>> GetAllAsync(
        string? search,
        int? category,
        int? flags);
    Task<Dish?> GetByIdAsync(Guid id);
    Task<Dish> UpdateAsync(Dish dish);
    Task DeleteAsync(Guid id);
}