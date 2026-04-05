using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBook.Infrastructure.Data;
using RecipeBook.Domain.Entities;
using RecipeBook.Domain.Enums;

namespace RecipeBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DishController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DishController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<Dish>> CreateDish(Dish dish)
        {
            ApplyMacros(dish);

            foreach (var ing in dish.Ingredients)
            {
                ing.Dish = dish;
            }

            _context.Dishes.Add(dish);
            await _context.SaveChangesAsync();

            return Ok(dish);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Dish>>> GetDishes(
            [FromQuery] DishCategory? category = null,
            [FromQuery] int? minCalories = null,
            [FromQuery] int? maxCalories = null)
        {
            var query = _context.Dishes
                .Include(d => d.Ingredients)
                .AsQueryable();

            if (category.HasValue)
                query = query.Where(d => d.Category == category.Value);

            if (minCalories.HasValue)
                query = query.Where(d => d.Calories >= minCalories.Value);

            if (maxCalories.HasValue)
                query = query.Where(d => d.Calories <= maxCalories.Value);

            var dishes = await query.ToListAsync();
            return Ok(dishes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Dish>> GetDish(Guid id)
        {
            var dish = await _context.Dishes
                .Include(d => d.Ingredients)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (dish == null) return NotFound();
            return Ok(dish);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDish(Guid id, Dish updatedDish)
        {
            if (id != updatedDish.Id) return BadRequest();

            ApplyMacros(updatedDish);

            _context.Entry(updatedDish).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DishExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDish(Guid id)
        {
            var dish = await _context.Dishes.FindAsync(id);
            if (dish == null) return NotFound();

            _context.Dishes.Remove(dish);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        private void ApplyMacros(Dish dish)
        {
            if (dish.Name.StartsWith("!первое"))
            {
                dish.Category = DishCategory.FirstCourse;
                dish.Name = dish.Name.Replace("!первое", "").Trim();
            }
            else if (dish.Name.StartsWith("!второе"))
            {
                dish.Category = DishCategory.SecondCourse;
                dish.Name = dish.Name.Replace("!второе", "").Trim();
            }
            else if (dish.Name.StartsWith("!десерт"))
            {
                dish.Category = DishCategory.Dessert;
                dish.Name = dish.Name.Replace("!десерт", "").Trim();
            }

        }

        private bool DishExists(Guid id)
        {
            return _context.Dishes.Any(e => e.Id == id);
        }
    }
}