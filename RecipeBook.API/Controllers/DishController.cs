using Microsoft.AspNetCore.Mvc;
using RecipeBook.Application.Services;
using RecipeBook.Domain.Enums;
using RecipeBook.Domain.Entities;

namespace RecipeBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DishController : ControllerBase
{
    private readonly DishService _dishService;

    public DishController(DishService dishService)
    {
        _dishService = dishService;
    }

    // 🔥 ФИЛЬТРЫ + ПОИСК
    [HttpGet]
    public async Task<IActionResult> GetAll(
        string? search,
        int? category,
        int? flags)
    {
        var dishes = await _dishService.GetAllAsync();

        if (!string.IsNullOrEmpty(search))
            dishes = dishes
                .Where(d => d.Name.ToLower().Contains(search.ToLower()))
                .ToList();

        if (category.HasValue)
            dishes = dishes
                .Where(d => (int)d.Category == category)
                .ToList();

        if (flags.HasValue)
            {
                var f = (Flags)flags.Value;

                dishes = dishes
                    .Where(d => (d.Flags & f) == f)
                    .ToList();
            }

        return Ok(dishes);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Dish dish)
    {
        var created = await _dishService.CreateAsync(dish);
        return Ok(created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _dishService.DeleteAsync(id);
        return Ok();
    }
}