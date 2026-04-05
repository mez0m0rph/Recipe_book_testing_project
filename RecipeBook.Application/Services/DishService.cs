using Microsoft.EntityFrameworkCore;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;
using RecipeBook.Infrastructure.Data;

namespace RecipeBook.Application.Services;

public class DishService : IDishService
{
    private readonly AppDbContext _context;

    public DishService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Dish> CreateAsync(Dish dish)
    {
        CalculateNutrition(dish);

        dish.Id = Guid.NewGuid();
        dish.CreatedAt = DateTime.UtcNow;

        _context.Dishes.Add(dish);
        await _context.SaveChangesAsync();

        return dish;
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

    public async Task<Dish> UpdateAsync(Dish dish)
    {
        CalculateNutrition(dish);

        dish.UpdatedAt = DateTime.UtcNow;

        _context.Dishes.Update(dish);
        await _context.SaveChangesAsync();

        return dish;
    }

    public async Task DeleteAsync(Guid id)
    {
        var dish = await _context.Dishes.FindAsync(id);
        if (dish == null) throw new Exception("Dish not found");

        _context.Dishes.Remove(dish);
        await _context.SaveChangesAsync();
    }

    private void CalculateNutrition(Dish dish)
    {
        double calories = 0, proteins = 0, fats = 0, carbs = 0;

        foreach (var ingredient in dish.Ingredients)
        {
            var product = _context.Products.Find(ingredient.ProductId);
            if (product == null) continue;

            var ratio = ingredient.Amount / 100.0;

            calories += product.Calories * ratio;
            proteins += product.Proteins * ratio;
            fats += product.Fats * ratio;
            carbs += product.Carbs * ratio;
        }

        dish.Calories = calories;
        dish.Proteins = proteins;
        dish.Fats = fats;
        dish.Carbs = carbs;
    }
}