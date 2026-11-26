import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo } from './Marca'
import Pie from './Pie'
import SelectorUsuario from './SelectorUsuario'

export interface ItemMenu {
  ruta: string
  etiqueta: string
}

export const MENU: ItemMenu[] = [
  { ruta: '/', etiqueta: 'Tablero' },
  { ruta: '/clientes', etiqueta: 'Clientes' },
  { ruta: '/recordatorios', etiqueta: 'Recordatorios' },
  { ruta: '/plan-anual', etiqueta: 'Plan anual' },
]

/** Ítems de navegación: Cabin 700 blanco; el activo va subrayado, como "Inicio" en el sitio. */
function Menu() {
  return (
    <>
      {MENU.map((it) => (
        <NavLink
          key={it.ruta}
          to={it.ruta}
          end={it.ruta === '/'}
          className={({ isActive }) =>
            `nav-enlace whitespace-nowrap px-3 py-2 font-display text-base font-bold no-underline transition-colors ${
              isActive ? 'text-white' : 'text-white/85 hover:text-white'
            }`
          }
        >
          {it.etiqueta}
        </NavLink>
      ))}
    </>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 bg-sch-black print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <NavLink to="/" className="shrink-0 no-underline" aria-label="SCH Gestión, ir al tablero">
            <Logo className="h-10 w-auto md:h-12" />
          </NavLink>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Secciones">
            <Menu />
          </nav>
          <div className="ml-auto md:ml-4">
            <SelectorUsuario />
          </div>
        </div>
        {/* En el celular la navegación pasa a una segunda fila con scroll horizontal */}
        <nav className="sin-barra mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2 md:hidden" aria-label="Secciones">
          <Menu />
        </nav>
      </header>
      {/* La clave hace que cada pantalla entre con su animación al navegar */}
      <main key={pathname} className="pagina-entrar mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Pie />
    </div>
  )
}
