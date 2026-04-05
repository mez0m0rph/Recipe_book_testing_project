using System.Text.Json.Serialization;

namespace RecipeBook.Domain.Entities;

public class DishIngredient
{
    public Guid DishId { get; set; }

    [JsonIgnore]
    public Dish? Dish { get; set; } = null!;

    public Guid ProductId { get; set; }

    [JsonIgnore]
    public Product? Product { get; set; } = null!;

    public double Amount { get; set; } 
}