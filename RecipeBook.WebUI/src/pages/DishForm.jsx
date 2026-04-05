import { useState, useEffect } from 'react';
import { createDish, getDish, updateDish, getProducts } from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';

export default function DishForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', portionSize: 100, category: 'Второе',
    flags: [], composition: []
  });
  const [products, setProducts] = useState([]);

  useEffect(() => { getProducts().then(res => setProducts(res.data)); }, []);
  useEffect(() => { if(id) getDish(id).then(res => setForm(res.data)); }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCompositionChange = (productId, quantity) => {
    setForm(prev => {
      const comp = [...prev.composition];
      const index = comp.findIndex(c => c.productId === productId);
      if(index !== -1) comp[index].quantity = quantity;
      else comp.push({ productId, quantity });
      return {...prev, composition: comp};
    });
  };

  const calculateKcal = () => {
    let cal = 0, p = 0, f = 0, c = 0;
    form.composition.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if(prod){
        const factor = item.quantity/100;
        cal += prod.calories * factor;
        p += prod.proteins * factor;
        f += prod.fats * factor;
        c += prod.carbs * factor;
      }
    });
    return { calories: cal, proteins: p, fats: f, carbs: c };
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const kbju = calculateKcal();
    const payload = {...form, ...kbju};
    if(id) await updateDish(id, payload);
    else await createDish(payload);
    navigate('/dishes');
  };

  const kbju = calculateKcal();

  return (
    <form onSubmit={handleSubmit}>
      <h2>{id ? 'Редактировать блюдо' : 'Создать блюдо'}</h2>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Название" required />
      <input name="portionSize" type="number" value={form.portionSize} onChange={handleChange} placeholder="Размер порции (г)" required />
      <select name="category" value={form.category} onChange={handleChange}>
        <option>Десерт</option>
        <option>Первое</option>
        <option>Второе</option>
        <option>Напиток</option>
        <option>Салат</option>
        <option>Суп</option>
        <option>Перекус</option>
      </select>
      <h3>Состав блюда</h3>
      {products.map(prod => {
        const compItem = form.composition.find(c => c.productId === prod.id);
        return (
          <div key={prod.id}>
            {prod.name}:
            <input type="number" min="0" value={compItem?.quantity || 0}
              onChange={e => handleCompositionChange(prod.id, parseFloat(e.target.value))} /> г
          </div>
        );
      })}
      <h3>Автоматически рассчитанное КБЖУ (на порцию)</h3>
      <div>Ккал: {kbju.calories.toFixed(2)}, Белки: {kbju.proteins.toFixed(2)}, Жиры: {kbju.fats.toFixed(2)}, Углеводы: {kbju.carbs.toFixed(2)}</div>
      <button type="submit">Сохранить</button>
    </form>
  );
}