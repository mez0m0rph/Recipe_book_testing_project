using Microsoft.AspNetCore.Mvc;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;
using RecipeBook.Domain.Enums;

namespace RecipeBook.API.Controllers;

[ApiController]
[Route("api/dishes")]
public class DishController : ControllerBase
{
    private readonly IDishService _dishService;

    public DishController(IDishService dishService)
    {
        _dishService = dishService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] DishCategory? category,
        [FromQuery] Flags? flags)
    {
        var dishes = await _dishService.GetAllAsync(search, category, flags);
        return Ok(dishes);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var dish = await _dishService.GetByIdAsync(id);

        if (dish == null)
        {
            return NotFound();
        }

        return Ok(dish);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dish dish)
    {
        var created = await _dishService.CreateAsync(dish);
        return Ok(created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Dish dish)
    {
        if (id != dish.Id)
        {
            return BadRequest("Id в URL и в теле запроса не совпадают.");
        }

        var updated = await _dishService.UpdateAsync(dish);
        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _dishService.DeleteAsync(id);
        return Ok();
    }
}