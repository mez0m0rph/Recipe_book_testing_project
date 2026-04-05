using Microsoft.EntityFrameworkCore;
using RecipeBook.Domain.Entities;
using RecipeBook.Infrastructure.Data;
using RecipeBook.Domain.Enums;

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

        ApplyCategoryFromName(dish); // макросы

        var products = await _context.Products.ToListAsync();

        dish.Calories = 0;
        dish.Proteins = 0;
        dish.Fats = 0;
        dish.Carbs = 0;

        foreach (var i in dish.Ingredients)
        {
            var p = products.First(x => x.Id == i.ProductId);

            dish.Calories += p.Calories * i.Amount / 100;
            dish.Proteins += p.Proteins * i.Amount / 100;
            dish.Fats += p.Fats * i.Amount / 100;
            dish.Carbs += p.Carbs * i.Amount / 100;
        }

        ApplyFlags(dish, products);

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

        ApplyCategoryFromName(existing); // макросы

        var products = await _context.Products.ToListAsync();
        ApplyFlags(existing, products);

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

    private void ApplyFlags(Dish dish, List<Product> products)
    {
        bool vegan = true;
        bool gluten = true;
        bool sugar = true;

        foreach (var i in dish.Ingredients)
        {
            var p = products.First(x => x.Id == i.ProductId);

            if (!p.Flags.HasFlag(Flags.Vegan)) vegan = false;
            if (!p.Flags.HasFlag(Flags.GlutenFree)) gluten = false;
            if (!p.Flags.HasFlag(Flags.SugarFree)) sugar = false;
        }

        dish.Flags = 0;

        if (vegan) dish.Flags |= Flags.Vegan;
        if (gluten) dish.Flags |= Flags.GlutenFree;
        if (sugar) dish.Flags |= Flags.SugarFree;
    }

    private void ApplyCategoryFromName(Dish dish)
    {
        if (string.IsNullOrWhiteSpace(dish.Name)) return;

        var lowerName = dish.Name.ToLower();

        if (lowerName.StartsWith("!десерт"))      { dish.Category = DishCategory.Dessert; dish.Name = dish.Name[7..].Trim(); return; }
        if (lowerName.StartsWith("!первое"))      { dish.Category = DishCategory.FirstCourse;   dish.Name = dish.Name[7..].Trim(); return; }
        if (lowerName.StartsWith("!второе"))      { dish.Category = DishCategory.SecondCourse;  dish.Name = dish.Name[7..].Trim(); return; }
        if (lowerName.StartsWith("!напиток"))     { dish.Category = DishCategory.Drink;   dish.Name = dish.Name[8..].Trim(); return; }
        if (lowerName.StartsWith("!салат"))       { dish.Category = DishCategory.Salad;   dish.Name = dish.Name[6..].Trim(); return; }
        if (lowerName.StartsWith("!суп"))         { dish.Category = DishCategory.Soup;    dish.Name = dish.Name[4..].Trim(); return; }
        if (lowerName.StartsWith("!перекус"))     { dish.Category = DishCategory.Snack;   dish.Name = dish.Name[8..].Trim(); return; }
    }
}