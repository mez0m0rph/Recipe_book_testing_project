using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeBook.Infrastructure.Data;
using RecipeBook.Domain.Entities;
using RecipeBook.Domain.Enums;

namespace RecipeBook.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(Product product)
        {
            ApplyMacros(product);

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(product);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts(
            [FromQuery] ProductCategory? category = null,
            [FromQuery] int? minCalories = null,
            [FromQuery] int? maxCalories = null,
            [FromQuery] Flags? flags = null)
        {
            var query = _context.Products.AsQueryable();

            if (category.HasValue)
                query = query.Where(p => p.Category == category.Value);

            if (minCalories.HasValue)
                query = query.Where(p => p.Calories >= minCalories.Value);

            if (maxCalories.HasValue)
                query = query.Where(p => p.Calories <= maxCalories.Value);

            if (flags.HasValue)
                query = query.Where(p => (p.Flags & flags.Value) != 0);

            var products = await query.ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(Guid id, Product updatedProduct)
        {
            if (id != updatedProduct.Id) return BadRequest();

            ApplyMacros(updatedProduct);

            _context.Entry(updatedProduct).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        private void ApplyMacros(Product product)
        {
            if (product.Name.StartsWith("!веган"))
            {
                product.Flags |= Flags.Vegan;
                product.Name = product.Name.Replace("!веган", "").Trim();
            }

        }

        private bool ProductExists(Guid id)
        {
            return _context.Products.Any(p => p.Id == id);
        }
    }
}