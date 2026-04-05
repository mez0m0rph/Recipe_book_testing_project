import { useEffect, useState } from 'react';
import { getProducts, deleteProduct } from '../api/api';
import { Link } from 'react-router-dom';

export default function Products() {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const res = await getProducts();
    setProducts(res.data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    await deleteProduct(id);
    fetchProducts();
  };

  return (
    <div>
      <h1>Продукты</h1>
      <Link to="/products/new">Добавить продукт</Link>
      <ul>
        {products.map(p => (
          <li key={p.id}>
            {p.name} ({p.category}) 
            <Link to={`/products/${p.id}`} style={{ marginLeft: '10px' }}>Редактировать</Link>
            <button onClick={() => handleDelete(p.id)} style={{ marginLeft: '5px' }}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}