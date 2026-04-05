using Microsoft.EntityFrameworkCore;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;
using RecipeBook.Infrastructure.Data;

namespace RecipeBook.Application.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Product> CreateAsync(Product product)
    {
        Validate(product);

        product.Id = Guid.NewGuid();
        product.CreatedAt = DateTime.UtcNow;

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return product;
    }

    public async Task<List<Product>> GetAllAsync(
        string? search,
        int? category,
        int? cookingType,
        int? flags,
        string? sortBy)
    {
        var query = _context.Products.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.Name.ToLower().Contains(search.ToLower()));
        }

        if (category.HasValue)
        {
            query = query.Where(p => (int)p.Category == category.Value);
        }

        if (cookingType.HasValue)
        {
            query = query.Where(p => (int)p.CookingType == cookingType.Value);
        }

        if (flags.HasValue)
        {
            query = query.Where(p => ((int)p.Flags & flags.Value) == flags.Value);
        }

        query = sortBy switch
        {
            "name" => query.OrderBy(p => p.Name),
            "calories" => query.OrderBy(p => p.Calories),
            "proteins" => query.OrderBy(p => p.Proteins),
            "fats" => query.OrderBy(p => p.Fats),
            "carbs" => query.OrderBy(p => p.Carbs),
            _ => query
        };

        return await query.ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _context.Products.FindAsync(id);
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        Validate(product);

        product.UpdatedAt = DateTime.UtcNow;

        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        return product;
    }

    public async Task DeleteAsync(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) throw new Exception("Product not found");

        var isUsed = await _context.DishIngredients
            .AnyAsync(di => di.ProductId == id);

        if (isUsed)
            throw new Exception("Product is used in dishes");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }

    private void Validate(Product product)
    {
        if (product.Proteins + product.Fats + product.Carbs > 100)
            throw new Exception("BJU sum cannot exceed 100");
    }
}