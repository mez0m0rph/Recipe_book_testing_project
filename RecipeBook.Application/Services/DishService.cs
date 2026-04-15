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
            .Include(x => x.Ingredients);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowered = search.Trim().ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(lowered));
        }

        if (category.HasValue)
        {
            query = query.Where(x => x.Category == category.Value);
        }

        if (flags.HasValue && flags.Value != Flags.None)
        {
            query = query.Where(x => (x.Flags & flags.Value) == flags.Value);
        }

        return await query
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<Dish?> GetByIdAsync(Guid id)
    {
        return await _context.Dishes
            .Include(x => x.Ingredients)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Dish> CreateAsync(Dish dish)
    {
        dish.Id = dish.Id == Guid.Empty ? Guid.NewGuid() : dish.Id;
        dish.CreatedAt = DateTime.UtcNow;
        dish.UpdatedAt = null;
        dish.Photos ??= new List<string>();

        NormalizeCategoryByMacro(dish, explicitCategoryProvided: true);
        await ValidateDishAsync(dish);
        await RecalculateNutritionAndAllowedFlagsAsync(dish);

        _context.Dishes.Add(dish);
        await _context.SaveChangesAsync();

        return dish;
    }

    public async Task<Dish> UpdateAsync(Dish dish)
    {
        var existing = await _context.Dishes
            .Include(x => x.Ingredients)
            .FirstOrDefaultAsync(x => x.Id == dish.Id);

        if (existing == null)
        {
            throw new Exception("Блюдо не найдено.");
        }

        existing.Name = dish.Name;
        existing.Photos = dish.Photos ?? new List<string>();
        existing.PortionSize = dish.PortionSize;
        existing.Category = dish.Category;
        existing.Flags = dish.Flags;

        _context.DishIngredients.RemoveRange(existing.Ingredients);

        existing.Ingredients = (dish.Ingredients ?? new List<DishIngredient>())
            .Select(x => new DishIngredient
            {
                DishId = existing.Id,
                ProductId = x.ProductId,
                Amount = x.Amount
            })
            .ToList();

        NormalizeCategoryByMacro(existing, explicitCategoryProvided: true);
        await ValidateDishAsync(existing);
        await RecalculateNutritionAndAllowedFlagsAsync(existing);

        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(Guid id)
    {
        var existing = await _context.Dishes
            .Include(x => x.Ingredients)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (existing == null)
        {
            return;
        }

        _context.DishIngredients.RemoveRange(existing.Ingredients);
        _context.Dishes.Remove(existing);
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

        dish.Photos ??= new List<string>();

        if (dish.Photos.Count > 5)
        {
            throw new Exception("Фотографий может быть не более 5.");
        }

        if (dish.Ingredients == null || dish.Ingredients.Count == 0)
        {
            throw new Exception("У блюда должен быть хотя бы один продукт в составе.");
        }

        if (dish.Ingredients.Any(x => x.Amount <= 0))
        {
            throw new Exception("Количество каждого продукта должно быть больше 0.");
        }

        var productIds = dish.Ingredients.Select(x => x.ProductId).Distinct().ToList();

        var existingProductIds = await _context.Products
            .Where(x => productIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        var missing = productIds.Except(existingProductIds).ToList();
        if (missing.Count > 0)
        {
            throw new Exception("В составе блюда есть несуществующие продукты.");
        }
    }

    private async Task RecalculateNutritionAndAllowedFlagsAsync(Dish dish)
    {
        var productIds = dish.Ingredients.Select(x => x.ProductId).Distinct().ToList();

        var products = await _context.Products
            .Where(x => productIds.Contains(x.Id))
            .ToListAsync();

        double calories = 0;
        double proteins = 0;
        double fats = 0;
        double carbs = 0;

        bool veganAllowed = true;
        bool glutenFreeAllowed = true;
        bool sugarFreeAllowed = true;

        foreach (var ingredient in dish.Ingredients)
        {
            var product = products.First(x => x.Id == ingredient.ProductId);

            calories += product.Calories * ingredient.Amount / 100.0;
            proteins += product.Proteins * ingredient.Amount / 100.0;
            fats += product.Fats * ingredient.Amount / 100.0;
            carbs += product.Carbs * ingredient.Amount / 100.0;

            if (!product.Flags.HasFlag(Flags.Vegan))
            {
                veganAllowed = false;
            }

            if (!product.Flags.HasFlag(Flags.GlutenFree))
            {
                glutenFreeAllowed = false;
            }

            if (!product.Flags.HasFlag(Flags.SugarFree))
            {
                sugarFreeAllowed = false;
            }
        }

        dish.Calories = Math.Round(calories, 2);
        dish.Proteins = Math.Round(proteins, 2);
        dish.Fats = Math.Round(fats, 2);
        dish.Carbs = Math.Round(carbs, 2);

        var bjuPer100g = dish.PortionSize > 0
            ? (dish.Proteins + dish.Fats + dish.Carbs) / dish.PortionSize * 100.0
            : 0;

        if (bjuPer100g > 100)
        {
            throw new Exception("Сумма БЖУ на 100 грамм блюда не может превышать 100.");
        }

        var requested = dish.Flags;
        dish.Flags = Flags.None;

        if (veganAllowed && requested.HasFlag(Flags.Vegan))
        {
            dish.Flags |= Flags.Vegan;
        }

        if (glutenFreeAllowed && requested.HasFlag(Flags.GlutenFree))
        {
            dish.Flags |= Flags.GlutenFree;
        }

        if (sugarFreeAllowed && requested.HasFlag(Flags.SugarFree))
        {
            dish.Flags |= Flags.SugarFree;
        }
    }

    private static void NormalizeCategoryByMacro(Dish dish, bool explicitCategoryProvided)
    {
        if (string.IsNullOrWhiteSpace(dish.Name))
        {
            return;
        }

        var words = dish.Name
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .ToList();

        var firstMacroIndex = words.FindIndex(x => x.StartsWith("!"));
        if (firstMacroIndex < 0)
        {
            return;
        }

        var macro = words[firstMacroIndex].ToLowerInvariant();

        DishCategory? macroCategory = macro switch
        {
            "!десерт" => DishCategory.Dessert,
            "!первое" => DishCategory.FirstCourse,
            "!второе" => DishCategory.SecondCourse,
            "!напиток" => DishCategory.Drink,
            "!салат" => DishCategory.Salad,
            "!суп" => DishCategory.Soup,
            "!перекус" => DishCategory.Snack,
            _ => null
        };

        words.RemoveAt(firstMacroIndex);
        dish.Name = string.Join(" ", words).Trim();

        if (!explicitCategoryProvided && macroCategory.HasValue)
        {
            dish.Category = macroCategory.Value;
        }
    }
}