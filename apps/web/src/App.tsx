import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/home";
import { Navbar } from "./components/layout/navbar/navbar";
import { Footer } from "./components/layout/footer";
function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
