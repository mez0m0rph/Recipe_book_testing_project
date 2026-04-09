using Microsoft.EntityFrameworkCore;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;
using RecipeBook.Domain.Enums;
using RecipeBook.Infrastructure.Data;

namespace RecipeBook.Application.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Product>> GetAllAsync(
        string? search,
        ProductCategory? category,
        CookingType? cookingType,
        Flags? flags,
        string? sortBy)
    {
        IQueryable<Product> query = _context.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowered = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(lowered));
        }

        if (category.HasValue)
        {
            query = query.Where(p => p.Category == category.Value);
        }

        if (cookingType.HasValue)
        {
            query = query.Where(p => p.CookingType == cookingType.Value);
        }

        if (flags.HasValue && flags.Value != Flags.None)
        {
            query = query.Where(p => (p.Flags & flags.Value) == flags.Value);
        }

        query = sortBy?.ToLower() switch
        {
            "name" => query.OrderBy(p => p.Name),
            "calories" => query.OrderBy(p => p.Calories),
            "proteins" => query.OrderBy(p => p.Proteins),
            "fats" => query.OrderBy(p => p.Fats),
            "carbs" => query.OrderBy(p => p.Carbs),
            _ => query.OrderBy(p => p.Name)
        };

        return await query.ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _context.Products.FindAsync(id);
    }

    public async Task<Product> CreateAsync(Product product)
    {
        ValidateProduct(product);

        product.Id = product.Id == Guid.Empty ? Guid.NewGuid() : product.Id;
        product.CreatedAt = DateTime.UtcNow;
        product.UpdatedAt = null;

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return product;
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        ValidateProduct(product);

        var existing = await _context.Products.FindAsync(product.Id);
        if (existing == null)
        {
            throw new Exception("Продукт не найден.");
        }

        existing.Name = product.Name;
        existing.Calories = product.Calories;
        existing.Proteins = product.Proteins;
        existing.Fats = product.Fats;
        existing.Carbs = product.Carbs;
        existing.Composition = product.Composition;
        existing.Category = product.Category;
        existing.CookingType = product.CookingType;
        existing.Flags = product.Flags;
        existing.Photos = product.Photos ?? new List<string>();
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task DeleteAsync(Guid id)
    {
        var usedInDishes = await _context.DishIngredients
            .Where(di => di.ProductId == id)
            .Include(di => di.Dish)
            .Select(di => di.Dish != null ? di.Dish.Name : null)
            .Where(name => name != null)
            .ToListAsync();

        if (usedInDishes.Count > 0)
        {
            throw new Exception(
                $"Нельзя удалить продукт. Он используется в блюдах: {string.Join(", ", usedInDishes!)}");
        }

        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return;
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }

    private static void ValidateProduct(Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Name) || product.Name.Trim().Length < 2)
        {
            throw new Exception("Название продукта должно содержать минимум 2 символа.");
        }

        if (product.Calories < 0 || product.Proteins < 0 || product.Fats < 0 || product.Carbs < 0)
        {
            throw new Exception("КБЖУ не могут быть отрицательными.");
        }

        if (product.Proteins > 100 || product.Fats > 100 || product.Carbs > 100)
        {
            throw new Exception("Белки, жиры и углеводы не могут быть больше 100 на 100 грамм.");
        }

        if (product.Proteins + product.Fats + product.Carbs > 100)
        {
            throw new Exception("Сумма БЖУ не может превышать 100 на 100 грамм.");
        }

        product.Photos ??= new List<string>();

        if (product.Photos.Count > 5)
        {
            throw new Exception("Можно указать не более 5 фотографий продукта.");
        }
    }
}