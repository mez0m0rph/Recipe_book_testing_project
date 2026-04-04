namespace RecipeBook.Domain.Entities;

public class DishIngredient
{
    public Guid DishId { get; set; }
    public Dish Dish { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public double Amount { get; set; } // граммы
}