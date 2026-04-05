using Microsoft.EntityFrameworkCore;
using RecipeBook.Domain.Entities;
using RecipeBook.Infrastructure.Data;

namespace RecipeBook.Application.Services;

public class ProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync()
    {
        return await _context.Products.ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _context.Products.FindAsync(id);
    }

    public async Task<Product> CreateAsync(Product product)
    {
        ValidateBJU(product);

        product.CreatedAt = DateTime.UtcNow;

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return product;
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        ValidateBJU(product);

        var existing = await _context.Products.FindAsync(product.Id);
        if (existing == null) throw new Exception("Product not found");

        _context.Entry(existing).CurrentValues.SetValues(product);
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(Guid id)
    {
        var isUsed = await _context.DishIngredients
            .AnyAsync(di => di.ProductId == id);

        if (isUsed)
            throw new Exception("Product is used in dishes");

        var product = await _context.Products.FindAsync(id);
        if (product == null) return;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }

    private void ValidateBJU(Product p)
    {
        if (p.Proteins + p.Fats + p.Carbs > 100)
            throw new Exception("BJU > 100");
    }
}