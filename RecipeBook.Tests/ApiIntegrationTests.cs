using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RecipeBook.Tests;

/// <summary>
/// Интеграционные/API-тесты backend'а.
/// 
/// Проверяется не отдельная функция, а работа цепочки:
/// HTTP-запрос -> Controller -> Service -> DbContext -> тестовая база данных -> HTTP-ответ.
/// 
/// В тестах используются техники:
/// 1. Эквивалентное разбиение
/// 2. Анализ граничных значений
/// </summary>
public class ApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        _jsonOptions.Converters.Add(new JsonStringEnumConverter());
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// валидный продукт должен успешно создаваться через API.
    /// </summary>
    [Fact]
    public async Task CreateProduct_ShouldReturnOk_WhenProductIsValid()
    {
        // Arrange
        var product = CreateValidProductPayload(
            name: "Картофель",
            proteins: 2,
            fats: 0.4,
            carbs: 17
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", product);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);

        Assert.Equal("Картофель", body.GetProperty("name").GetString());
        Assert.True(body.GetProperty("id").GetGuid() != Guid.Empty);
    }

    /// <summary>
    /// Анализ граничных значений:
    /// название продукта длиной 1 символ невалидно,
    /// название длиной 2 символа валидно.
    /// </summary>
    [Theory]
    [InlineData("A", HttpStatusCode.BadRequest)]
    [InlineData("AB", HttpStatusCode.OK)]
    public async Task CreateProduct_ShouldValidateNameLength_BoundaryValues(
        string name,
        HttpStatusCode expectedStatusCode)
    {
        // Arrange
        var product = CreateValidProductPayload(name: name);

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", product);

        // Assert
        Assert.Equal(expectedStatusCode, response.StatusCode);
    }

    /// <summary>
    /// Анализ граничных значений:
    /// сумма БЖУ ровно 100 допустима,
    /// сумма БЖУ больше 100 недопустима.
    /// </summary>
    [Theory]
    [InlineData(40, 30, 30, HttpStatusCode.OK)]
    [InlineData(40, 30, 30.01, HttpStatusCode.BadRequest)]
    public async Task CreateProduct_ShouldValidatePfcSum_BoundaryValues(
        double proteins,
        double fats,
        double carbs,
        HttpStatusCode expectedStatusCode)
    {
        // Arrange
        var product = CreateValidProductPayload(
            name: $"Продукт-{Guid.NewGuid()}",
            proteins: proteins,
            fats: fats,
            carbs: carbs
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/products", product);

        // Assert
        Assert.Equal(expectedStatusCode, response.StatusCode);
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// после создания продукта его можно получить в общем списке продуктов.
    /// </summary>
    [Fact]
    public async Task GetProducts_ShouldReturnCreatedProduct()
    {
        // Arrange
        var productName = $"Морковь-{Guid.NewGuid()}";

        var product = CreateValidProductPayload(
            name: productName,
            proteins: 1.3,
            fats: 0.1,
            carbs: 7
        );

        var createResponse = await _client.PostAsJsonAsync("/api/products", product);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var getResponse = await _client.GetAsync("/api/products");

        // Assert
        getResponse.EnsureSuccessStatusCode();

        var body = await getResponse.Content.ReadAsStringAsync();

        Assert.Contains(productName, body);
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// поиск продукта должен работать по подстроке без учёта регистра.
    /// </summary>
    [Fact]
    public async Task GetProducts_ShouldSearchByNameSubstringIgnoringCase()
    {
        // Arrange
        var productName = $"Свёкла-{Guid.NewGuid()}";

        var product = CreateValidProductPayload(name: productName);

        var createResponse = await _client.PostAsJsonAsync("/api/products", product);
        createResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync("/api/products?search=свёк");

        // Assert
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();

        Assert.Contains("Свёкла", body);
    }

    /// <summary>
    /// Интеграционный сценарий:
    /// блюдо создаётся через API на основе существующего продукта,
    /// а backend автоматически рассчитывает калорийность блюда.
    /// </summary>
    [Fact]
    public async Task CreateDish_ShouldAutomaticallyCalculateCalories_WhenIngredientsAreValid()
    {
        // Arrange
        var productId = await CreateProductAndReturnIdAsync(
            name: $"Рис-{Guid.NewGuid()}",
            calories: 300,
            proteins: 7,
            fats: 1,
            carbs: 70
        );

        var dish = new
        {
            name = "Рисовая каша",
            photos = Array.Empty<string>(),
            calories = 0,
            proteins = 0,
            fats = 0,
            carbs = 0,
            portionSize = 200,
            category = "Snack",
            flags = 0,
            ingredients = new[]
            {
                new
                {
                    productId = productId,
                    amount = 200
                }
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/dishes", dish);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);

        // 300 ккал / 100 г * 200 г / 100 = 600 ккал
        Assert.Equal(600, body.GetProperty("calories").GetDouble(), precision: 2);
    }

    /// <summary>
    /// Анализ граничных значений:
    /// размер порции 0 недопустим,
    /// минимальное положительное значение 0.01 допустимо.
    /// </summary>
    [Theory]
    [InlineData(0, HttpStatusCode.BadRequest)]
    [InlineData(0.01, HttpStatusCode.OK)]
    public async Task CreateDish_ShouldValidatePortionSize_BoundaryValues(
        double portionSize,
        HttpStatusCode expectedStatusCode)
    {
        // Arrange
        var productId = await CreateProductAndReturnIdAsync(
            name: $"Овсянка-{Guid.NewGuid()}",
            calories: 100,
            proteins: 5,
            fats: 2,
            carbs: 20
        );

        var dish = new
        {
            name = $"Блюдо-{Guid.NewGuid()}",
            photos = Array.Empty<string>(),
            calories = 0,
            proteins = 0,
            fats = 0,
            carbs = 0,
            portionSize = portionSize,
            category = "Snack",
            flags = 0,
            ingredients = new[]
            {
                new
                {
                    productId = productId,
                    amount = 0.01
                }
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/dishes", dish);

        // Assert
        Assert.Equal(expectedStatusCode, response.StatusCode);
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// блюдо без ингредиентов невалидно и должно отклоняться API.
    /// </summary>
    [Fact]
    public async Task CreateDish_ShouldReturnBadRequest_WhenIngredientsAreEmpty()
    {
        // Arrange
        var dish = new
        {
            name = "Пустое блюдо",
            photos = Array.Empty<string>(),
            calories = 0,
            proteins = 0,
            fats = 0,
            carbs = 0,
            portionSize = 100,
            category = "Snack",
            flags = 0,
            ingredients = Array.Empty<object>()
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/dishes", dish);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static object CreateValidProductPayload(
        string name,
        double calories = 100,
        double proteins = 10,
        double fats = 5,
        double carbs = 20)
    {
        return new
        {
            name = name,
            photos = Array.Empty<string>(),
            calories = calories,
            proteins = proteins,
            fats = fats,
            carbs = carbs,
            composition = "Тестовый состав",
            category = "Vegetables",
            cookingType = "ReadyToEat",
            flags = 0
        };
    }

    private async Task<Guid> CreateProductAndReturnIdAsync(
        string name,
        double calories,
        double proteins,
        double fats,
        double carbs)
    {
        var product = CreateValidProductPayload(
            name: name,
            calories: calories,
            proteins: proteins,
            fats: fats,
            carbs: carbs
        );

        var response = await _client.PostAsJsonAsync("/api/products", product);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);

        return body.GetProperty("id").GetGuid();
    }
}