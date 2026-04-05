using Microsoft.EntityFrameworkCore;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;
using RecipeBook.Infrastructure.Data;
using RecipeBook.Domain.Enums;

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
        ApplyCategoryMacro(dish); 

        CalculateNutrition(dish);

        dish.Id = Guid.NewGuid();
        dish.CreatedAt = DateTime.UtcNow;

        _context.Dishes.Add(dish);
        await _context.SaveChangesAsync();

        return dish;
    }

    public async Task<List<Dish>> GetAllAsync(
        string? search,
        int? category,
        int? flags)
    {
        var query = _context.Dishes
            .Include(d => d.Ingredients)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(d => d.Name.ToLower().Contains(search.ToLower()));
        }

        if (category.HasValue)
        {
            query = query.Where(d => (int)d.Category == category.Value);
        }

        if (flags.HasValue)
        {
            query = query.Where(d => ((int)d.Flags & flags.Value) == flags.Value);
        }

        return await query.ToListAsync();
    }

    public async Task<Dish?> GetByIdAsync(Guid id)
    {
        return await _context.Dishes
            .Include(d => d.Ingredients)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<Dish> UpdateAsync(Dish dish)
    {
        ApplyCategoryMacro(dish); 

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

    private void ApplyCategoryMacro(Dish dish)
    {
        if (string.IsNullOrWhiteSpace(dish.Name)) return;

        var name = dish.Name.ToLower();

        var macros = new Dictionary<string, DishCategory>
        {
            { "!десерт", DishCategory.Dessert },
            { "!первое", DishCategory.FirstCourse },
            { "!второе", DishCategory.SecondCourse },
            { "!напиток", DishCategory.Drink },
            { "!салат", DishCategory.Salad },
            { "!суп", DishCategory.Soup },
            { "!перекус", DishCategory.Snack }
        };

        foreach (var macro in macros)
        {
            if (name.Contains(macro.Key))
            {
                if ((int)dish.Category == 0)
                {
                    dish.Category = macro.Value;
                }

                dish.Name = dish.Name
                    .Replace(macro.Key, "", StringComparison.OrdinalIgnoreCase)
                    .Trim();

                break;
            }
        }
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