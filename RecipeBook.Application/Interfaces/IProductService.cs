using RecipeBook.Domain.Entities;

namespace RecipeBook.Application.Interfaces;

public interface IProductService
{
    Task<Product> CreateAsync(Product product);
    Task<List<Product>> GetAllAsync(
        string? search,
        int? category,
        int? cookingType,
        int? flags,
        string? sortBy);
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Guid id);
}