using RecipeBook.Domain.Entities;

namespace RecipeBook.Application.Services;

/// <summary>
/// Выполняет автоматический расчёт КБЖУ блюда на порцию
/// на основе КБЖУ продуктов на 100 грамм и количества
/// каждого продукта в составе блюда.
/// </summary>
public static class DishNutritionCalculator
{
    /// <summary>
    /// Рассчитывает калорийность блюда на порцию.
    /// Формула:
    /// Σ(калорийность продукта на 100 г * количество продукта / 100)
    /// </summary>
    public static double CalculateCaloriesPerPortion(
        IEnumerable<DishIngredient> ingredients,
        IEnumerable<Product> products)
    {
        if (ingredients == null)
        {
            throw new ArgumentNullException(nameof(ingredients));
        }

        if (products == null)
        {
            throw new ArgumentNullException(nameof(products));
        }

        var ingredientsList = ingredients.ToList();
        var productsList = products.ToList();

        if (ingredientsList.Any(x => x.Amount < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(ingredients), "Количество продукта не может быть отрицательным.");
        }

        if (productsList.Any(x => x.Calories < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(products), "Калорийность продукта не может быть отрицательной.");
        }

        var productMap = productsList.ToDictionary(x => x.Id);

        double calories = 0;

        foreach (var ingredient in ingredientsList)
        {
            if (!productMap.TryGetValue(ingredient.ProductId, out var product))
            {
                throw new InvalidOperationException(
                    $"Продукт с id '{ingredient.ProductId}' не найден для расчёта калорийности.");
            }

            calories += product.Calories * ingredient.Amount / 100.0;
        }

        return Math.Round(calories, 2);
    }

    /// <summary>
    /// Рассчитывает белки блюда на порцию.
    /// </summary>
    public static double CalculateProteinsPerPortion(
        IEnumerable<DishIngredient> ingredients,
        IEnumerable<Product> products)
    {
        if (ingredients == null)
        {
            throw new ArgumentNullException(nameof(ingredients));
        }

        if (products == null)
        {
            throw new ArgumentNullException(nameof(products));
        }

        var ingredientsList = ingredients.ToList();
        var productsList = products.ToList();

        if (ingredientsList.Any(x => x.Amount < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(ingredients), "Количество продукта не может быть отрицательным.");
        }

        if (productsList.Any(x => x.Proteins < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(products), "Количество белков не может быть отрицательным.");
        }

        var productMap = productsList.ToDictionary(x => x.Id);

        double proteins = 0;

        foreach (var ingredient in ingredientsList)
        {
            if (!productMap.TryGetValue(ingredient.ProductId, out var product))
            {
                throw new InvalidOperationException(
                    $"Продукт с id '{ingredient.ProductId}' не найден для расчёта белков.");
            }

            proteins += product.Proteins * ingredient.Amount / 100.0;
        }

        return Math.Round(proteins, 2);
    }

    /// <summary>
    /// Рассчитывает жиры блюда на порцию.
    /// </summary>
    public static double CalculateFatsPerPortion(
        IEnumerable<DishIngredient> ingredients,
        IEnumerable<Product> products)
    {
        if (ingredients == null)
        {
            throw new ArgumentNullException(nameof(ingredients));
        }

        if (products == null)
        {
            throw new ArgumentNullException(nameof(products));
        }

        var ingredientsList = ingredients.ToList();
        var productsList = products.ToList();

        if (ingredientsList.Any(x => x.Amount < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(ingredients), "Количество продукта не может быть отрицательным.");
        }

        if (productsList.Any(x => x.Fats < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(products), "Количество жиров не может быть отрицательным.");
        }

        var productMap = productsList.ToDictionary(x => x.Id);

        double fats = 0;

        foreach (var ingredient in ingredientsList)
        {
            if (!productMap.TryGetValue(ingredient.ProductId, out var product))
            {
                throw new InvalidOperationException(
                    $"Продукт с id '{ingredient.ProductId}' не найден для расчёта жиров.");
            }

            fats += product.Fats * ingredient.Amount / 100.0;
        }

        return Math.Round(fats, 2);
    }

    /// <summary>
    /// Рассчитывает углеводы блюда на порцию.
    /// </summary>
    public static double CalculateCarbsPerPortion(
        IEnumerable<DishIngredient> ingredients,
        IEnumerable<Product> products)
    {
        if (ingredients == null)
        {
            throw new ArgumentNullException(nameof(ingredients));
        }

        if (products == null)
        {
            throw new ArgumentNullException(nameof(products));
        }

        var ingredientsList = ingredients.ToList();
        var productsList = products.ToList();

        if (ingredientsList.Any(x => x.Amount < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(ingredients), "Количество продукта не может быть отрицательным.");
        }

        if (productsList.Any(x => x.Carbs < 0))
        {
            throw new ArgumentOutOfRangeException(nameof(products), "Количество углеводов не может быть отрицательным.");
        }

        var productMap = productsList.ToDictionary(x => x.Id);

        double carbs = 0;

        foreach (var ingredient in ingredientsList)
        {
            if (!productMap.TryGetValue(ingredient.ProductId, out var product))
            {
                throw new InvalidOperationException(
                    $"Продукт с id '{ingredient.ProductId}' не найден для расчёта углеводов.");
            }

            carbs += product.Carbs * ingredient.Amount / 100.0;
        }

        return Math.Round(carbs, 2);
    }
}