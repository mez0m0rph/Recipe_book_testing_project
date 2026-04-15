using RecipeBook.Domain.Enums;

namespace RecipeBook.Domain.Entities;

public class Dish
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public List<string> Photos { get; set; } = new();

    public double Calories { get; set; }
    public double Proteins { get; set; }
    public double Fats { get; set; }
    public double Carbs { get; set; }

    public double PortionSize { get; set; }

    public DishCategory Category { get; set; }

    public Flags Flags { get; set; } = Flags.None;

    public List<DishIngredient> Ingredients { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}