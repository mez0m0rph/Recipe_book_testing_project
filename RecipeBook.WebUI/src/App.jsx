import { useEffect, useState } from "react";

const API = "http://localhost:5116/api";

export default function App() {
  const [products, setProducts] = useState([]);
  const [dishes, setDishes] = useState([]);

  const [productName, setProductName] = useState("");
  const [dishName, setDishName] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [amount, setAmount] = useState(100);

  const [search, setSearch] = useState("");

  const loadData = async () => {
    const p = await fetch(`${API}/Product`).then(r => r.json());
    const d = await fetch(`${API}/Dish`).then(r => r.json());

    setProducts(p);
    setDishes(d);
  };

  useEffect(() => {
    loadData();
  }, []);

  const createProduct = async () => {
    await fetch(`${API}/Product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: productName,
        calories: 100,
        proteins: 10,
        fats: 5,
        carbs: 20,
        category: 0,
        cookingType: 0,
        flags: 0,
        photos: []
      })
    });

    setProductName("");
    loadData();
  };

  const createDish = async () => {
    await fetch(`${API}/Dish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: dishName,
        portionSize: 200,
        category: 0,
        flags: 0,
        photos: [],
        ingredients: [
          {
            productId: selectedProductId,
            amount: Number(amount)
          }
        ]
      })
    });

    setDishName("");
    loadData();
  };

  const filteredDishes = dishes.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>Recipe Book</h1>

      <h2>Add Product</h2>
      <input value={productName} onChange={e => setProductName(e.target.value)} />
      <button onClick={createProduct}>Add</button>

      <h2>Products</h2>
      <ul>
        {products.map(p => <li key={p.id}>{p.name}</li>)}
      </ul>

      <h2>Add Dish</h2>
      <input value={dishName} onChange={e => setDishName(e.target.value)} />

      <select onChange={e => setSelectedProductId(e.target.value)}>
        <option>Select product</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <button onClick={createDish}>Add Dish</button>

      <h3>Search</h3>
      <input onChange={e => setSearch(e.target.value)} />

      <h2>Dishes</h2>
      <ul>
        {filteredDishes.map(d => (
          <li key={d.id}>{d.name}</li>
        ))}
      </ul>
    </div>
  );
}