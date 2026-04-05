import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Dishes from './pages/Dishes';
import DishForm from './pages/DishForm';

function App() {
  return (
    <Router>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/products" style={{ marginRight: '10px' }}>Продукты</Link>
        <Link to="/dishes">Блюда</Link>
      </nav>
      <Routes>
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductForm />} />
        <Route path="/dishes" element={<Dishes />} />
        <Route path="/dishes/new" element={<DishForm />} />
        <Route path="/dishes/:id" element={<DishForm />} />
      </Routes>
    </Router>
  );
}

export default App;