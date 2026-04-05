using Microsoft.EntityFrameworkCore;
using RecipeBook.Infrastructure.Data;
using RecipeBook.Application.Interfaces;
using RecipeBook.Application.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql("Host=127.0.0.1;Port=5432;Database=recipebook;Username=postgres;Password=postgres"));

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IDishService, DishService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();