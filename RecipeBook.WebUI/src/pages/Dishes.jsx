import { useEffect, useState } from 'react';
import { getDishes, deleteDish } from '../api/api';
import { Link } from 'react-router-dom';

export default function Dishes() {
  const [dishes, setDishes] = useState([]);

  const fetchDishes = async () => {
    const res = await getDishes();
    setDishes(res.data);
  };

  useEffect(() => { fetchDishes(); }, []);

  const handleDelete = async (id) => {
    await deleteDish(id);
    fetchDishes();
  };

  return (
    <div>
      <h1>Блюда</h1>
      <Link to="/dishes/new">Добавить блюдо</Link>
      <ul>
        {dishes.map(d => (
          <li key={d.id}>
            {d.name} ({d.category}) 
            <Link to={`/dishes/${d.id}`} style={{ marginLeft: '10px' }}>Редактировать</Link>
            <button onClick={() => handleDelete(d.id)} style={{ marginLeft: '5px' }}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}