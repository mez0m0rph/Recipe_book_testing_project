using Microsoft.AspNetCore.Mvc;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;

namespace RecipeBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DishController : ControllerBase
{
    private readonly IDishService _service;

    public DishController(IDishService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(Dish dish)
    {
        return Ok(await _service.CreateAsync(dish));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var dish = await _service.GetByIdAsync(id);
        if (dish == null) return NotFound();

        return Ok(dish);
    }

    [HttpPut]
    public async Task<IActionResult> Update(Dish dish)
    {
        return Ok(await _service.UpdateAsync(dish));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return Ok();
    }
}