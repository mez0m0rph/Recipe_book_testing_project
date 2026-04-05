import { useState, useEffect } from 'react';
import { createProduct, getProduct, updateProduct } from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', calories: 0, proteins: 0, fats: 0, carbs: 0,
    category: 'Овощи', flags: [], needCooking: 'Готовый к употреблению'
  });

  useEffect(() => {
    if (id) getProduct(id).then(res => setForm(res.data));
  }, [id]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (name === 'flags') {
      setForm(prev => ({
        ...prev,
        flags: checked
          ? [...prev.flags, value]
          : prev.flags.filter(f => f !== value)
      }));
    } else setForm({ ...form, [name]: type === 'number' ? parseFloat(value) : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.proteins + form.fats + form.carbs > 100) {
      alert('Сумма БЖУ не может превышать 100');
      return;
    }
    if (id) await updateProduct(id, form);
    else await createProduct(form);
    navigate('/products');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{id ? 'Редактировать продукт' : 'Создать продукт'}</h2>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Название" required />
      <input name="calories" type="number" value={form.calories} onChange={handleChange} placeholder="Ккал" required />
      <input name="proteins" type="number" value={form.proteins} onChange={handleChange} placeholder="Белки" required />
      <input name="fats" type="number" value={form.fats} onChange={handleChange} placeholder="Жиры" required />
      <input name="carbs" type="number" value={form.carbs} onChange={handleChange} placeholder="Углеводы" required />
      <select name="category" value={form.category} onChange={handleChange}>
        <option>Замороженный</option>
        <option>Мясной</option>
        <option>Овощи</option>
        <option>Зелень</option>
        <option>Специи</option>
        <option>Крупы</option>
        <option>Консервы</option>
        <option>Жидкость</option>
        <option>Сладости</option>
      </select>
      <select name="needCooking" value={form.needCooking} onChange={handleChange}>
        <option>Готовый к употреблению</option>
        <option>Полуфабрикат</option>
        <option>Требует приготовления</option>
      </select>
      <div>
        <label><input type="checkbox" name="flags" value="Веган" checked={form.flags.includes('Веган')} onChange={handleChange} /> Веган</label>
        <label><input type="checkbox" name="flags" value="Без глютена" checked={form.flags.includes('Без глютена')} onChange={handleChange} /> Без глютена</label>
        <label><input type="checkbox" name="flags" value="Без сахара" checked={form.flags.includes('Без сахара')} onChange={handleChange} /> Без сахара</label>
      </div>
      <button type="submit">Сохранить</button>
    </form>
  );
}