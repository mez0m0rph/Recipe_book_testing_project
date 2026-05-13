using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RecipeBook.Tests;

/// <summary>
/// Интеграционные/API-тесты backend'а.
///
/// Тесты отправляют реальные HTTP-запросы в уже запущенный backend:
/// http://localhost:5116
///
/// Проверяется цепочка:
/// HTTP-запрос -> Controller -> Service -> DbContext -> PostgreSQL -> HTTP-ответ.
///
/// В тестах используются техники:
/// 1. Эквивалентное разбиение
/// 2. Анализ граничных значений
/// </summary>
public class ApiIntegrationTests
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiIntegrationTests()
    {
        _client = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:5116")
        };

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
        var product = CreateValidProductPayload(
            name: $"Картофель-{Guid.NewGuid()}",
            proteins: 2,
            fats: 0.4,
            carbs: 17
        );

        var response = await _client.PostAsJsonAsync("/api/products", product);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);

        Assert.Contains("Картофель", body.GetProperty("name").GetString());
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
        var product = CreateValidProductPayload(name: name);

        var response = await _client.PostAsJsonAsync("/api/products", product);

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
        var product = CreateValidProductPayload(
            name: $"Продукт-{Guid.NewGuid()}",
            proteins: proteins,
            fats: fats,
            carbs: carbs
        );

        var response = await _client.PostAsJsonAsync("/api/products", product);

        Assert.Equal(expectedStatusCode, response.StatusCode);
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// после создания продукта его можно получить в общем списке продуктов.
    /// </summary>
    [Fact]
    public async Task GetProducts_ShouldReturnCreatedProduct()
    {
        var productName = $"Морковь-{Guid.NewGuid()}";

        var product = CreateValidProductPayload(
            name: productName,
            proteins: 1.3,
            fats: 0.1,
            carbs: 7
        );

        var createResponse = await _client.PostAsJsonAsync("/api/products", product);
        createResponse.EnsureSuccessStatusCode();

        var getResponse = await _client.GetAsync("/api/products");

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
        var productName = $"Свёкла-{Guid.NewGuid()}";

        var product = CreateValidProductPayload(name: productName);

        var createResponse = await _client.PostAsJsonAsync("/api/products", product);
        createResponse.EnsureSuccessStatusCode();

        var response = await _client.GetAsync("/api/products?search=свёк");

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync();

        Assert.Contains("Свёкла", body);
    }

    /// <summary>
    /// Негативный API-сценарий:
    /// запрос продукта по несуществующему id должен возвращать клиентскую ошибку.
    /// </summary>
    [Fact]
    public async Task GetProductById_ShouldReturnClientError_WhenProductDoesNotExist()
    {
        var missingId = Guid.NewGuid();

        var response = await _client.GetAsync($"/api/products/{missingId}");

        AssertClientError(response.StatusCode);
    }

    /// <summary>
    /// Негативный API-сценарий:
    /// редактирование несуществующего продукта должно возвращать клиентскую ошибку.
    /// </summary>
    [Fact]
    public async Task UpdateProduct_ShouldReturnClientError_WhenProductDoesNotExist()
    {
        var missingId = Guid.NewGuid();

        var product = CreateValidProductPayload(
            name: "Несуществующий продукт",
            proteins: 1,
            fats: 1,
            carbs: 1
        );

        var response = await _client.PutAsJsonAsync($"/api/products/{missingId}", product);

        AssertClientError(response.StatusCode);
    }

    /// <summary>
    /// Негативный API-сценарий:
    /// удаление несуществующего продукта не должно возвращать серверную ошибку.
    /// </summary>
    [Fact]
    public async Task DeleteProduct_ShouldNotReturnServerError_WhenProductDoesNotExist()
    {
        var missingId = Guid.NewGuid();

        var response = await _client.DeleteAsync($"/api/products/{missingId}");

        Assert.True(
            IsSuccess(response.StatusCode) || IsClientError(response.StatusCode),
            $"Expected success or client error, but got {(int)response.StatusCode} {response.StatusCode}."
        );
    }

    /// <summary>
    /// Интеграционный сценарий:
    /// блюдо создаётся через API на основе существующего продукта,
    /// а backend автоматически рассчитывает калорийность блюда.
    /// </summary>
    [Fact]
    public async Task CreateDish_ShouldAutomaticallyCalculateCalories_WhenIngredientsAreValid()
    {
        var productId = await CreateProductAndReturnIdAsync(
            name: $"Рис-{Guid.NewGuid()}",
            calories: 300,
            proteins: 7,
            fats: 1,
            carbs: 70
        );

        var dish = new
        {
            name = $"Рисовая каша-{Guid.NewGuid()}",
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

        var response = await _client.PostAsJsonAsync("/api/dishes", dish);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions);

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

        var response = await _client.PostAsJsonAsync("/api/dishes", dish);

        Assert.Equal(expectedStatusCode, response.StatusCode);
    }

    /// <summary>
    /// Эквивалентное разбиение:
    /// блюдо без ингредиентов невалидно и должно отклоняться API.
    /// </summary>
    [Fact]
    public async Task CreateDish_ShouldReturnBadRequest_WhenIngredientsAreEmpty()
    {
        var dish = new
        {
            name = $"Пустое блюдо-{Guid.NewGuid()}",
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

        var response = await _client.PostAsJsonAsync("/api/dishes", dish);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Негативный интеграционный сценарий:
    /// блюдо нельзя создать, если в составе указан несуществующий продукт.
    /// </summary>
    [Fact]
    public async Task CreateDish_ShouldReturnBadRequest_WhenIngredientProductDoesNotExist()
    {
        var dish = new
        {
            name = $"Блюдо с несуществующим продуктом-{Guid.NewGuid()}",
            photos = Array.Empty<string>(),
            calories = 0,
            proteins = 0,
            fats = 0,
            carbs = 0,
            portionSize = 100,
            category = "Snack",
            flags = 0,
            ingredients = new[]
            {
                new
                {
                    productId = Guid.NewGuid(),
                    amount = 100
                }
            }
        };

        var response = await _client.PostAsJsonAsync("/api/dishes", dish);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Негативный API-сценарий:
    /// запрос блюда по несуществующему id должен возвращать клиентскую ошибку.
    /// </summary>
    [Fact]
    public async Task GetDishById_ShouldReturnClientError_WhenDishDoesNotExist()
    {
        var missingId = Guid.NewGuid();

        var response = await _client.GetAsync($"/api/dishes/{missingId}");

        AssertClientError(response.StatusCode);
    }

    /// <summary>
    /// Негативный API-сценарий:
    /// редактирование несуществующего блюда должно возвращать клиентскую ошибку.
    /// </summary>
    [Fact]
    public async Task UpdateDish_ShouldReturnClientError_WhenDishDoesNotExist()
    {
        var missingDishId = Guid.NewGuid();

        var productId = await CreateProductAndReturnIdAsync(
            name: $"Гречка-{Guid.NewGuid()}",
            calories: 120,
            proteins: 4,
            fats: 1,
            carbs: 25
        );

        var dish = new
        {
            id = missingDishId,
            name = "Несуществующее блюдо",
            photos = Array.Empty<string>(),
            calories = 0,
            proteins = 0,
            fats = 0,
            carbs = 0,
            portionSize = 100,
            category = "Snack",
            flags = 0,
            ingredients = new[]
            {
                new
                {
                    productId = productId,
                    amount = 100
                }
            }
        };

        var response = await _client.PutAsJsonAsync($"/api/dishes/{missingDishId}", dish);

        AssertClientError(response.StatusCode);
    }

    /// <summary>
    /// Функциональное требование:
    /// продукт, который используется хотя бы в одном блюде,
    /// нельзя удалить через API.
    /// </summary>
    [Fact]
    public async Task DeleteProduct_ShouldReturnBadRequest_WhenProductIsUsedInDish()
    {
        var productId = await CreateProductAndReturnIdAsync(
            name: $"Мясо-{Guid.NewGuid()}",
            calories: 250,
            proteins: 20,
            fats: 15,
            carbs: 0
        );

        var dishName = $"Блюдо с мясом-{Guid.NewGuid()}";

        var dish = new
        {
            name = dishName,
            photos = Array.Empty<string>(),
            calories = 0,
            proteins = 0,
            fats = 0,
            carbs = 0,
            portionSize = 100,
            category = "SecondCourse",
            flags = 0,
            ingredients = new[]
            {
                new
                {
                    productId = productId,
                    amount = 100
                }
            }
        };

        var createDishResponse = await _client.PostAsJsonAsync("/api/dishes", dish);
        createDishResponse.EnsureSuccessStatusCode();

        var deleteProductResponse = await _client.DeleteAsync($"/api/products/{productId}");

        Assert.Equal(HttpStatusCode.BadRequest, deleteProductResponse.StatusCode);

        var body = await deleteProductResponse.Content.ReadAsStringAsync();

        Assert.Contains(dishName, body);
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

    private static void AssertClientError(HttpStatusCode statusCode)
    {
        Assert.True(
            IsClientError(statusCode),
            $"Expected client error, but got {(int)statusCode} {statusCode}."
        );
    }

    private static bool IsClientError(HttpStatusCode statusCode)
    {
        var code = (int)statusCode;
        return code >= 400 && code <= 499;
    }

    private static bool IsSuccess(HttpStatusCode statusCode)
    {
        var code = (int)statusCode;
        return code >= 200 && code <= 299;
    }
}