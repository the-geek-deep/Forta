import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import WalletCreate from "./Wallet/WalletCreate";
export default function WebApp() {
  return (
    <div>
    <BrowserRouter>
        <Header />
        <Routes>
            
            <Route path="/" element={<WalletCreate />} />
            
        </Routes>
    </BrowserRouter>
    </div>
  );
}