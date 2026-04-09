import { Link, Navigate, Route, Routes } from "react-router-dom";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import Dishes from "./pages/Dishes";
import DishForm from "./pages/DishForm";

function App() {
    return (
        <div style={{ fontFamily: "Arial, sans-serif" }}>
            <header
                style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #ddd",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center"
                }}
            >
                <h1 style={{ margin: 0, fontSize: "24px" }}>Книга рецептов</h1>

                <nav style={{ display: "flex", gap: "12px" }}>
                    <Link to="/products">Продукты</Link>
                    <Link to="/dishes">Блюда</Link>
                </nav>
            </header>

            <main style={{ padding: "20px" }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/products" replace />} />

                    <Route path="/products" element={<Products />} />
                    <Route path="/products/create" element={<ProductForm />} />
                    <Route path="/products/edit/:id" element={<ProductForm />} />

                    <Route path="/dishes" element={<Dishes />} />
                    <Route path="/dishes/create" element={<DishForm />} />
                    <Route path="/dishes/edit/:id" element={<DishForm />} />

                    <Route path="*" element={<Navigate to="/products" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;