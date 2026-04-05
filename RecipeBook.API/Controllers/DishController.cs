using Microsoft.AspNetCore.Mvc;
using RecipeBook.Application.Services;
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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var dishes = await _dishService.GetAllAsync();
        return Ok(dishes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var dish = await _dishService.GetByIdAsync(id);
        return Ok(dish);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Dish dish)
    {
        var created = await _dishService.CreateAsync(dish);
        return Ok(created);
    }

    [HttpPut]
    public async Task<IActionResult> Update(Dish dish)
    {
        var updated = await _dishService.UpdateAsync(dish);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _dishService.DeleteAsync(id);
        return Ok();
    }
}