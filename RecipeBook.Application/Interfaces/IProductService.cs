using RecipeBook.Domain.Entities;
using RecipeBook.Domain.Enums;

namespace RecipeBook.Application.Interfaces;

public interface IProductService
{
    Task<List<Product>> GetAllAsync(
        string? search,
        ProductCategory? category,
        CookingType? cookingType,
        Flags? flags,
        string? sortBy);

    Task<Product?> GetByIdAsync(Guid id);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Guid id);
}