using RecipeBook.Application.Services;
using RecipeBook.Domain.Entities;

namespace RecipeBook.Tests;

/// <summary>
/// Unit-тесты для автоматического расчёта калорийности блюда.
///
/// В тестах применяются:
/// 1. Эквивалентное разбиение
/// 2. Анализ граничных значений
///
/// Тестируется формула:
/// Σ(калорийность продукта на 100 г * количество продукта / 100)
/// </summary>
public class DishCaloriesCalculationTests
{
    /// <summary>
    /// Создаёт тестовый продукт с заданной калорийностью.
    /// Остальные поля не важны для расчёта калорийности.
    /// </summary>
    private static Product CreateProduct(Guid id, double calories)
    {
        return new Product
        {
            Id = id,
            Name = $"Product-{id}",
            Calories = calories,
            Proteins = 0,
            Fats = 0,
            Carbs = 0,
            Photos = new List<string>(),
            Composition = null,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// корректные классы данных для количества продукта:
    /// - 0 г
    /// - обычное положительное значение
    /// - дробное значение
    /// - несколько ингредиентов
    /// </summary>
    [Theory]
    [InlineData(100, 0, 0)]
    [InlineData(100, 100, 100)]
    [InlineData(250, 100, 250)]
    [InlineData(250, 50, 125)]
    [InlineData(123.4, 25, 30.85)]
    public void CalculateCaloriesPerPortion_ShouldReturnExpectedValue_ForValidEquivalentClasses(
        double productCalories,
        double amount,
        double expectedCalories)
    {
        // Arrange
        var productId = Guid.NewGuid();

        var products = new List<Product>
        {
            CreateProduct(productId, productCalories)
        };

        var ingredients = new List<DishIngredient>
        {
            new DishIngredient
            {
                ProductId = productId,
                Amount = amount
            }
        };

        // Act
        var result = DishNutritionCalculator.CalculateCaloriesPerPortion(ingredients, products);

        // Assert
        Assert.Equal(expectedCalories, result, precision: 2);
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// корректный случай с несколькими продуктами.
    /// </summary>
    [Fact]
    public void CalculateCaloriesPerPortion_ShouldSumCaloriesFromAllIngredients()
    {
        // Arrange
        var product1Id = Guid.NewGuid();
        var product2Id = Guid.NewGuid();

        var products = new List<Product>
        {
            CreateProduct(product1Id, 200),
            CreateProduct(product2Id, 50)
        };

        var ingredients = new List<DishIngredient>
        {
            new DishIngredient
            {
                ProductId = product1Id,
                Amount = 150
            },
            new DishIngredient
            {
                ProductId = product2Id,
                Amount = 200
            }
        };

        // 200 * 150 / 100 = 300
        // 50 * 200 / 100 = 100
        // Итого = 400

        // Act
        var result = DishNutritionCalculator.CalculateCaloriesPerPortion(ingredients, products);

        // Assert
        Assert.Equal(400, result, precision: 2);
    }

    /// <summary>
    /// Анализ граничных значений:
    /// количество продукта около границы 100 г.
    /// </summary>
    [Theory]
    [InlineData(99.99, 99.99)]
    [InlineData(100.00, 100.00)]
    [InlineData(100.01, 100.01)]
    public void CalculateCaloriesPerPortion_ShouldHandleBoundaryValuesAround100Grams(
        double amount,
        double expectedCalories)
    {
        // Arrange
        var productId = Guid.NewGuid();

        var products = new List<Product>
        {
            CreateProduct(productId, 100)
        };

        var ingredients = new List<DishIngredient>
        {
            new DishIngredient
            {
                ProductId = productId,
                Amount = amount
            }
        };

        // Act
        var result = DishNutritionCalculator.CalculateCaloriesPerPortion(ingredients, products);

        // Assert
        Assert.Equal(expectedCalories, result, precision: 2);
    }

    /// <summary>
    /// Анализ граничных значений:
    /// калорийность продукта около границы 0.
    /// </summary>
    [Theory]
    [InlineData(0, 100, 0)]
    [InlineData(0.01, 100, 0.01)]
    [InlineData(0.01, 50, 0)]
    public void CalculateCaloriesPerPortion_ShouldHandleBoundaryValuesAroundZeroCalories(
        double productCalories,
        double amount,
        double expectedCalories)
    {
        // Arrange
        var productId = Guid.NewGuid();

        var products = new List<Product>
        {
            CreateProduct(productId, productCalories)
        };

        var ingredients = new List<DishIngredient>
        {
            new DishIngredient
            {
                ProductId = productId,
                Amount = amount
            }
        };

        // Act
        var result = DishNutritionCalculator.CalculateCaloriesPerPortion(ingredients, products);

        // Assert
        Assert.Equal(expectedCalories, result, precision: 2);
    }

    /// <summary>
    /// Негативный сценарий:
    /// если для ингредиента нет соответствующего продукта,
    /// должен выбрасываться exception.
    /// </summary>
    [Fact]
    public void CalculateCaloriesPerPortion_ShouldThrowException_WhenProductForIngredientIsMissing()
    {
        // Arrange
        var ingredients = new List<DishIngredient>
        {
            new DishIngredient
            {
                ProductId = Guid.NewGuid(),
                Amount = 100
            }
        };

        var products = new List<Product>();

        // Act
        Action action = () =>
        {
            DishNutritionCalculator.CalculateCaloriesPerPortion(ingredients, products);
        };

        // Assert
        Assert.Throws<InvalidOperationException>(action);
    }

    /// <summary>
    /// Негативный сценарий:
    /// null-аргументы должны приводить к ArgumentNullException.
    /// </summary>
    [Fact]
    public void CalculateCaloriesPerPortion_ShouldThrowArgumentNullException_WhenIngredientsIsNull()
    {
        // Arrange
        var products = new List<Product>();

        // Act
        Action action = () =>
        {
            DishNutritionCalculator.CalculateCaloriesPerPortion(null!, products);
        };

        // Assert
        Assert.Throws<ArgumentNullException>(action);
    }

    /// <summary>
    /// Негативный сценарий:
    /// null-аргументы должны приводить к ArgumentNullException.
    /// </summary>
    [Fact]
    public void CalculateCaloriesPerPortion_ShouldThrowArgumentNullException_WhenProductsIsNull()
    {
        // Arrange
        var ingredients = new List<DishIngredient>();

        // Act
        Action action = () =>
        {
            DishNutritionCalculator.CalculateCaloriesPerPortion(ingredients, null!);
        };

        // Assert
        Assert.Throws<ArgumentNullException>(action);
    }
}