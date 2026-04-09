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
            .HasKey(di => new { di.DishId, di.ProductId });

        modelBuilder.Entity<DishIngredient>()
            .HasOne(di => di.Dish)
            .WithMany(d => d.Ingredients)
            .HasForeignKey(di => di.DishId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DishIngredient>()
            .HasOne(di => di.Product)
            .WithMany()
            .HasForeignKey(di => di.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Product>()
            .Property(p => p.Photos)
            .HasConversion(
                v => string.Join(';', v),
                v => string.IsNullOrWhiteSpace(v)
                    ? new List<string>()
                    : v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList());

        modelBuilder.Entity<Dish>()
            .Property(d => d.Photos)
            .HasConversion(
                v => string.Join(';', v),
                v => string.IsNullOrWhiteSpace(v)
                    ? new List<string>()
                    : v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList());
    }
}