import { useEffect, useState } from "react";

export default function DishList() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5116/api/Dish")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dishes");
        return res.json();
      })
      .then((data) => setDishes(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dishes...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Dishes</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Name</th>
            <th>Portion Size</th>
            <th>Calories</th>
            <th>Proteins</th>
            <th>Fats</th>
            <th>Carbs</th>
          </tr>
        </thead>
        <tbody>
          {dishes.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.portionSize}</td>
              <td>{d.calories}</td>
              <td>{d.proteins}</td>
              <td>{d.fats}</td>
              <td>{d.carbs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}