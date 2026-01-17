'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth';
import {
    BsCalendarCheck,
    BsGrid,
    BsPeople,
    BsBoxSeam,
    BsScissors,
    BsPerson,
    BsCashCoin,
    BsGraphUp,
    BsBoxArrowRight,
    BsChevronLeft,
    BsChevronRight,
    BsPersonBadge,
    BsGear
} from 'react-icons/bs';

export default function SidebarNavigation() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const store = useAuthStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        store.logout();
        router.push('/login');
    };

    const isActive = (href: string) => {
        if (href === '/' && pathname === '/') return true;
        if (href !== '/' && pathname.startsWith(href)) return true;
        return false;
    };

    if (!mounted) return <div className="w-64 bg-white border-r border-gray-200"></div>;

    const NavItem = ({ href, label, icon: Icon, isSpecial = false }: { href: string, label: string, icon: any, isSpecial?: boolean }) => (
        <Link
            href={href}
            title={isCollapsed ? label : ''}
            className={`group flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-2 my-1
                ${isActive(href)
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
                ${isSpecial ? 'font-bold' : ''}
                ${isCollapsed ? 'justify-center px-0 mx-1' : ''}
            `}
        >
            <Icon className={`flex-shrink-0 h-5 w-5 ${isActive(href) ? 'text-pink-600' : 'text-gray-400 group-hover:text-gray-600'} ${isCollapsed ? 'm-0' : 'mr-3'}`} />
            {!isCollapsed && <span className="truncate">{label}</span>}
        </Link>
    );

    return (
        <div
            className={`flex flex-col bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out relative flex-shrink-0 z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}
            style={{ minHeight: '100vh' }}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-12 bg-white border border-gray-200 rounded-full p-1 shadow-md z-50 hover:text-pink-600 transition-colors"
                aria-label={isCollapsed ? "Expandir" : "Colapsar"}
            >
                {isCollapsed ? <BsChevronRight size={14} /> : <BsChevronLeft size={14} />}
            </button>

            {/* Header / Logo */}
            <div className={`p-6 mb-2 ${isCollapsed ? 'px-2 text-center' : ''}`}>
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        F
                    </div>
                    {!isCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <h2 className="font-bold text-gray-800 truncate">Firenze Beauty</h2>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Gestión</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-2">
                <NavItem href="/calendar" label="Agenda" icon={BsCalendarCheck} isSpecial />

                <div className={`mx-4 my-3 border-b border-gray-100 ${isCollapsed ? 'mx-2' : ''}`}></div>

                <div className="space-y-1">
                    <NavItem href="/" label="Inicio" icon={BsGrid} />

                    {store.isAdmin && (
                        <NavItem href="/employees" label="Profesionales" icon={BsPeople} />
                    )}

                    {/* Levels 1, 2, 3 cannot see Products, Services, and Sales */}
                    {!(store.level === '1' || store.level === '2' || store.level === '3') && (
                        <>
                            <NavItem href="/products" label="Productos" icon={BsBoxSeam} />
                            <NavItem href="/services" label="Servicios" icon={BsScissors} />
                            <NavItem href="/sales" label="Ventas" icon={BsCashCoin} />
                        </>
                    )}

                    <NavItem href="/clients" label="Clientes" icon={BsPerson} />
                    <NavItem href="/appointments" label="Citas" icon={BsCalendarCheck} />

                    <div className={`mx-4 my-3 border-b border-gray-100 ${isCollapsed ? 'mx-2' : ''}`}></div>
                    <NavItem href="/profile" label="Perfil" icon={BsPersonBadge} />

                    {store.canAccessAnalytics && (
                        <>
                            <div className={`mx-4 my-3 border-b border-gray-100 ${isCollapsed ? 'mx-2' : ''}`}></div>
                            <NavItem href="/analytics" label="Analíticas" icon={BsGraphUp} />
                        </>
                    )}
                </div>
            </nav>

            {/* Footer / Settings & Logout */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-1">
                {store.level === '6' && (
                    <NavItem href="/settings" label="Configuración" icon={BsGear} />
                )}
                <button
                    onClick={handleLogout}
                    className={`flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? "Cerrar Sesión" : ""}
                >
                    <BsBoxArrowRight className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && <span>Cerrar Sesión</span>}
                </button>
            </div>
        </div>
    );
}
