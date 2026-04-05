using Microsoft.EntityFrameworkCore;
using RecipeBook.Domain.Entities;
using RecipeBook.Infrastructure.Data;

namespace RecipeBook.Application.Services;

public class DishService
{
    private readonly AppDbContext _context;

    public DishService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Dish>> GetAllAsync()
    {
        return await _context.Dishes
            .Include(d => d.Ingredients)
            .ToListAsync();
    }

    public async Task<Dish?> GetByIdAsync(Guid id)
    {
        return await _context.Dishes
            .Include(d => d.Ingredients)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Dish> CreateAsync(Dish dish)
    {
        dish.CreatedAt = DateTime.UtcNow;

        // КБЖУ расчет
        var products = await _context.Products.ToListAsync();

        dish.Calories = dish.Ingredients.Sum(i =>
            products.First(p => p.Id == i.ProductId).Calories * i.Amount / 100);

        dish.Proteins = dish.Ingredients.Sum(i =>
            products.First(p => p.Id == i.ProductId).Proteins * i.Amount / 100);

        dish.Fats = dish.Ingredients.Sum(i =>
            products.First(p => p.Id == i.ProductId).Fats * i.Amount / 100);

        dish.Carbs = dish.Ingredients.Sum(i =>
            products.First(p => p.Id == i.ProductId).Carbs * i.Amount / 100);

        _context.Dishes.Add(dish);
        await _context.SaveChangesAsync();

        return dish;
    }

    public async Task<Dish> UpdateAsync(Dish dish)
    {
        var existing = await _context.Dishes
            .Include(d => d.Ingredients)
            .FirstOrDefaultAsync(d => d.Id == dish.Id);

        if (existing == null) throw new Exception("Dish not found");

        _context.Entry(existing).CurrentValues.SetValues(dish);
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(Guid id)
    {
        var dish = await _context.Dishes.FindAsync(id);
        if (dish == null) return;

        _context.Dishes.Remove(dish);
        await _context.SaveChangesAsync();
    }
}