import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./Pages/Landing";
import Face from "./Pages/Face";
import ToastifyComponent from "./Components/ToastifyComponent";

const App = () => {
  return (
    <Router>
      <ToastifyComponent />
      <Routes>

        <Route path="/" element={<Landing />} />


        <Route path="/face" element={<Face />} />
      </Routes>
    </Router>
  );
};

export default App;
