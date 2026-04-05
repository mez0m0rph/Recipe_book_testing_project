import { useEffect, useState } from "react";

const API = "http://localhost:5116/api";

export default function App() {
  const [products, setProducts] = useState([]);
  const [dishes, setDishes] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [flags, setFlags] = useState("");

  const [error, setError] = useState("");

  const load = async () => {
    let url = `${API}/Dish?`;

    if (search) url += `search=${search}&`;
    if (category) url += `category=${category}&`;
    if (flags) url += `flags=${flags}&`;

    const d = await fetch(url).then(r => r.json());
    const p = await fetch(`${API}/Product`).then(r => r.json());

    setDishes(d);
    setProducts(p);
  };

  useEffect(() => { load(); }, []);

  const deleteProduct = async (id) => {
    const res = await fetch(`${API}/Product/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const msg = await res.text();
      setError(msg);
      return;
    }

    load();
  };

  const getFlagText = (flags) => {
    let res = [];
    if (flags & 1) res.push("🌱 Vegan");
    if (flags & 2) res.push("🚫 Gluten");
    if (flags & 4) res.push("🍬 No sugar");
    return res.join(", ");
  };

  const getCategory = (c) => {
    return ["Dessert","First","Second","Drink","Salad","Soup","Snack"][c];
  };

  return (
    <div style={{
      padding:40,
      fontFamily:"Arial",
      background:"#f5f5f5"
    }}>
      <h1 style={{textAlign:"center"}}>🍽 Recipe Book</h1>

      {error && <p style={{color:"red"}}>{error}</p>}

      <div style={{marginBottom:30}}>
        <input placeholder="Search"
          onChange={e => setSearch(e.target.value)} />

        <select onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="0">Dessert</option>
          <option value="1">First</option>
          <option value="2">Second</option>
        </select>

        <select onChange={e => setFlags(e.target.value)}>
          <option value="">All flags</option>
          <option value="1">Vegan</option>
          <option value="2">Gluten free</option>
          <option value="4">No sugar</option>
        </select>

        <button onClick={load}>Apply</button>
      </div>

      <h2>Products</h2>
      <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
        {products.map(p => (
          <div key={p.id} style={{
            background:"white",
            padding:10,
            borderRadius:10
          }}>
            {p.name}
            <button onClick={() => deleteProduct(p.id)}>❌</button>
          </div>
        ))}
      </div>

      <h2>Dishes</h2>
      <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
        {dishes.map(d => (
          <div key={d.id} style={{
            background:"white",
            padding:15,
            width:220,
            borderRadius:10,
            boxShadow:"0 2px 5px rgba(0,0,0,0.1)"
          }}>
            <h3>{d.name}</h3>

            <p>🔥 {d.calories}</p>
            <p>🥩 {d.proteins}</p>
            <p>🧈 {d.fats}</p>
            <p>🍞 {d.carbs}</p>

            <p>📂 {getCategory(d.category)}</p>
            <p>{getFlagText(d.flags)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}