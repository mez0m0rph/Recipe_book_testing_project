using Microsoft.EntityFrameworkCore;
using RecipeBook.Domain.Entities;

namespace RecipeBook.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Dish> Dishes => Set<Dish>();
    public DbSet<DishIngredient> DishIngredients => Set<DishIngredient>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DishIngredient>()
            .HasKey(x => new { x.DishId, x.ProductId });

        modelBuilder.Entity<DishIngredient>()
            .HasOne(x => x.Dish)
            .WithMany(x => x.Ingredients)
            .HasForeignKey(x => x.DishId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DishIngredient>()
            .HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .Property(x => x.Photos)
            .HasConversion(
                x => string.Join(";", x),
                x => string.IsNullOrWhiteSpace(x)
                    ? new List<string>()
                    : x.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList());

        modelBuilder.Entity<Dish>()
            .Property(x => x.Photos)
            .HasConversion(
                x => string.Join(";", x),
                x => string.IsNullOrWhiteSpace(x)
                    ? new List<string>()
                    : x.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList());
    }
}