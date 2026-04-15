using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using RecipeBook.Application.Interfaces;
using RecipeBook.Application.Services;
using RecipeBook.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IDishService, DishService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql("Host=127.0.0.1;Port=5432;Database=recipebook;Username=postgres;Password=postgres"));

var app = builder.Build();

var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var uploadsPath = Path.Combine(wwwrootPath, "uploads");

if (!Directory.Exists(wwwrootPath))
{
    Directory.CreateDirectory(wwwrootPath);
}

if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.Run();