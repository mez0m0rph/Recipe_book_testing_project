using Microsoft.AspNetCore.Mvc;
using RecipeBook.Application.Interfaces;
using RecipeBook.Domain.Entities;

namespace RecipeBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IProductService _service;

    public ProductController(IProductService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(Product product)
    {
        var result = await _service.CreateAsync(product);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        string? search,
        int? category,
        int? cookingType,
        int? flags,
        string? sortBy)
    {
        var result = await _service.GetAllAsync(search, category, cookingType, flags, sortBy);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var product = await _service.GetByIdAsync(id);
        if (product == null) return NotFound();

        return Ok(product);
    }

    [HttpPut]
    public async Task<IActionResult> Update(Product product)
    {
        return Ok(await _service.UpdateAsync(product));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return Ok();
    }
}