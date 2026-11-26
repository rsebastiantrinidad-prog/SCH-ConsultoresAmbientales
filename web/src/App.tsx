import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Tablero from './pages/Tablero'
import Clientes from './pages/Clientes'
import FichaCliente from './pages/FichaCliente'
import Recordatorios from './pages/Recordatorios'
import PlanAnual from './pages/PlanAnual'
import NoEncontrada from './pages/NoEncontrada'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Tablero />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<FichaCliente />} />
        <Route path="recordatorios" element={<Recordatorios />} />
        <Route path="plan-anual" element={<PlanAnual />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
