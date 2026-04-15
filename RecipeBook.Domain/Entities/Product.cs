using RecipeBook.Domain.Enums;

namespace RecipeBook.Domain.Entities;

public class Product
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public List<string> Photos { get; set; } = new();

    public double Calories { get; set; }
    public double Proteins { get; set; }
    public double Fats { get; set; }
    public double Carbs { get; set; }

    public string? Composition { get; set; }

    public ProductCategory Category { get; set; }
    public CookingType CookingType { get; set; }

    public Flags Flags { get; set; } = Flags.None;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}