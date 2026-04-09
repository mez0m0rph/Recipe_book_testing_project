using Microsoft.EntityFrameworkCore;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;
using RecipeBook.Domain.Enums;
using RecipeBook.Infrastructure.Data;

namespace RecipeBook.Application.Services;

public class DishService : IDishService
{
    private readonly AppDbContext _context;

    public DishService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Dish>> GetAllAsync(
        string? search,
        DishCategory? category,
        Flags? flags)
    {
        IQueryable<Dish> query = _context.Dishes
            .Include(d => d.Ingredients);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowered = search.Trim().ToLower();
            query = query.Where(d => d.Name.ToLower().Contains(lowered));
        }

        if (category.HasValue)
        {
            query = query.Where(d => d.Category == category.Value);
        }

        if (flags.HasValue && flags.Value != Flags.None)
        {
            query = query.Where(d => (d.Flags & flags.Value) == flags.Value);
        }

        return await query
            .OrderBy(d => d.Name)
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
        await ValidateDishAsync(dish);

        dish.Id = dish.Id == Guid.Empty ? Guid.NewGuid() : dish.Id;
        dish.CreatedAt = DateTime.UtcNow;
        dish.UpdatedAt = null;

        ApplyCategoryFromName(dish, categoryWasExplicitlySet: true);
        await RecalculateNutritionAndFlagsAsync(dish);

        _context.Dishes.Add(dish);
        await _context.SaveChangesAsync();

        return dish;
    }

    public async Task<Dish> UpdateAsync(Dish dish)
    {
        await ValidateDishAsync(dish);

        var existing = await _context.Dishes
            .Include(d => d.Ingredients)
            .FirstOrDefaultAsync(d => d.Id == dish.Id);

        if (existing == null)
        {
            throw new Exception("Блюдо не найдено.");
        }

        existing.Name = dish.Name;
        existing.PortionSize = dish.PortionSize;
        existing.Category = dish.Category;
        existing.Photos = dish.Photos ?? new List<string>();

        _context.DishIngredients.RemoveRange(existing.Ingredients);

        existing.Ingredients = dish.Ingredients.Select(i => new DishIngredient
        {
            DishId = existing.Id,
            ProductId = i.ProductId,
            Amount = i.Amount
        }).ToList();

        existing.Calories = dish.Calories;
        existing.Proteins = dish.Proteins;
        existing.Fats = dish.Fats;
        existing.Carbs = dish.Carbs;
        existing.Flags = dish.Flags;
        existing.UpdatedAt = DateTime.UtcNow;

        ApplyCategoryFromName(existing, categoryWasExplicitlySet: true);
        await RecalculateNutritionAndFlagsAsync(existing);

        await _context.SaveChangesAsync();

        return existing;
    }

    public async Task DeleteAsync(Guid id)
    {
        var dish = await _context.Dishes
            .Include(d => d.Ingredients)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dish == null)
        {
            return;
        }

        _context.DishIngredients.RemoveRange(dish.Ingredients);
        _context.Dishes.Remove(dish);

        await _context.SaveChangesAsync();
    }

    private async Task ValidateDishAsync(Dish dish)
    {
        if (string.IsNullOrWhiteSpace(dish.Name) || dish.Name.Trim().Length < 2)
        {
            throw new Exception("Название блюда должно содержать минимум 2 символа.");
        }

        if (dish.PortionSize <= 0)
        {
            throw new Exception("Размер порции должен быть больше 0.");
        }

        if (dish.Ingredients == null || dish.Ingredients.Count == 0)
        {
            throw new Exception("У блюда должен быть хотя бы один ингредиент.");
        }

        if (dish.Ingredients.Any(i => i.Amount <= 0))
        {
            throw new Exception("Количество каждого продукта должно быть больше 0.");
        }

        dish.Photos ??= new List<string>();

        if (dish.Photos.Count > 5)
        {
            throw new Exception("Можно указать не более 5 фотографий блюда.");
        }

        var productIds = dish.Ingredients.Select(i => i.ProductId).Distinct().ToList();

        var existingProductIds = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var missingIds = productIds.Except(existingProductIds).ToList();

        if (missingIds.Count > 0)
        {
            throw new Exception("В составе блюда есть несуществующие продукты.");
        }
    }

    private async Task RecalculateNutritionAndFlagsAsync(Dish dish)
    {
        var productIds = dish.Ingredients.Select(i => i.ProductId).Distinct().ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        double calculatedCalories = 0;
        double calculatedProteins = 0;
        double calculatedFats = 0;
        double calculatedCarbs = 0;

        bool veganAvailable = true;
        bool glutenFreeAvailable = true;
        bool sugarFreeAvailable = true;

        foreach (var ingredient in dish.Ingredients)
        {
            var product = products.First(p => p.Id == ingredient.ProductId);

            calculatedCalories += product.Calories * ingredient.Amount / 100.0;
            calculatedProteins += product.Proteins * ingredient.Amount / 100.0;
            calculatedFats += product.Fats * ingredient.Amount / 100.0;
            calculatedCarbs += product.Carbs * ingredient.Amount / 100.0;

            if (!product.Flags.HasFlag(Flags.Vegan))
            {
                veganAvailable = false;
            }

            if (!product.Flags.HasFlag(Flags.GlutenFree))
            {
                glutenFreeAvailable = false;
            }

            if (!product.Flags.HasFlag(Flags.SugarFree))
            {
                sugarFreeAvailable = false;
            }
        }

        dish.Calories = calculatedCalories;
        dish.Proteins = calculatedProteins;
        dish.Fats = calculatedFats;
        dish.Carbs = calculatedCarbs;

        var requestedFlags = dish.Flags;

        dish.Flags = Flags.None;

        if (veganAvailable && requestedFlags.HasFlag(Flags.Vegan))
        {
            dish.Flags |= Flags.Vegan;
        }

        if (glutenFreeAvailable && requestedFlags.HasFlag(Flags.GlutenFree))
        {
            dish.Flags |= Flags.GlutenFree;
        }

        if (sugarFreeAvailable && requestedFlags.HasFlag(Flags.SugarFree))
        {
            dish.Flags |= Flags.SugarFree;
        }
    }

    private static void ApplyCategoryFromName(Dish dish, bool categoryWasExplicitlySet)
    {
        if (string.IsNullOrWhiteSpace(dish.Name))
        {
            return;
        }

        var words = dish.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0)
        {
            return;
        }

        var firstMacro = words.FirstOrDefault(w => w.StartsWith("!"));
        if (firstMacro == null)
        {
            return;
        }

        var detectedCategory = firstMacro.ToLower() switch
        {
            "!десерт" => DishCategory.Dessert,
            "!первое" => DishCategory.FirstCourse,
            "!второе" => DishCategory.SecondCourse,
            "!напиток" => DishCategory.Drink,
            "!салат" => DishCategory.Salad,
            "!суп" => DishCategory.Soup,
            "!перекус" => DishCategory.Snack,
            _ => (DishCategory?)null
        };

        dish.Name = string.Join(" ", words.Where(w => w != firstMacro)).Trim();

        if (!categoryWasExplicitlySet && detectedCategory.HasValue)
        {
            dish.Category = detectedCategory.Value;
        }
    }
}