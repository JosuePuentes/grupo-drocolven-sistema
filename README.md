# Sistema de Gestión de Farmacias - Grupo Drocolven

Sistema integral para la gestión centralizada de inventarios, ventas, proveedores y reportes para una red de farmacias.

## 🏢 Descripción del Proyecto

Este sistema fue desarrollado específicamente para **Grupo Drocolven** para centralizar la gestión de inventarios de su red de farmacias, optimizar las compras y analizar las ventas de manera integral.

## ✨ Funcionalidades Principales

### 🏪 Gestión de Farmacias
- CRUD completo de farmacias de la red
- Administración centralizada de múltiples ubicaciones

### 📦 Gestión de Inventarios
- Subida masiva de inventarios desde archivos Excel
- Estructura adaptada a formato específico de Drocolven
- Campos: Código, Descripción, Laboratorio, Nacional, Departamento, Fecha Vencimiento, Precio, Descuento, Precio Neto, Pedido (stock), Total

### 🔍 Búsqueda Inteligente
- Buscador estilo MercadoLibre
- Búsqueda global entre todas las farmacias
- Carrito de compras integrado
- Comparación de precios y disponibilidad

### 👥 Gestión de Usuarios
- Sistema de roles: Administrador, Gerente, Farmacéutico, Vendedor
- Permisos granulares por módulo y acción
- Autenticación segura con contraseñas encriptadas
- Gestión de contraseñas y perfiles

### 🚚 Gestión de Proveedores
- CRUD completo de proveedores
- Campos financieros específicos:
  - Días de crédito
  - Descuento comercial
  - Descuento por pronto pago
- Subida de listas de precios desde Excel

### 📊 Lista Comparativa
- Buscador global entre todas las listas de proveedores
- Cálculo automático de precios con descuentos comerciales
- Identificación automática del mejor precio
- Comparación visual con opciones desplegables

### 📈 Reportes y Análisis
- **Vista Consolidada**: Reporte por producto con totales generales
- **Vista Detallada**: Análisis por farmacia individual
- Productos en falla (stock bajo o agotado)
- Sugerencias automáticas de compra
- Análisis de rotación y reposición
- Estadísticas en tiempo real

## 🛠️ Tecnologías Utilizadas

### Backend
- **Framework**: Flask (Python)
- **Base de Datos**: SQLite con SQLAlchemy ORM
- **Autenticación**: Werkzeug Security
- **Procesamiento Excel**: openpyxl
- **API REST**: Flask-CORS habilitado

### Frontend
- **Framework**: React 18
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Iconos**: Lucide React
- **Build**: Vite

## 📁 Estructura del Proyecto

```
grupo-drocolven-sistema/
├── backend/                 # Aplicación Flask
│   ├── src/
│   │   ├── main.py         # Punto de entrada
│   │   ├── models/         # Modelos de base de datos
│   │   ├── routes/         # Rutas de la API
│   │   ├── static/         # Archivos estáticos (frontend compilado)
│   │   └── database/       # Base de datos SQLite
│   ├── venv/               # Entorno virtual Python
│   └── requirements.txt    # Dependencias Python
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── App.jsx        # Componente principal
│   │   └── components/    # Componentes React
│   ├── dist/              # Build de producción
│   └── package.json       # Dependencias Node.js
├── docs/                  # Documentación
│   ├── arquitectura.md    # Arquitectura del sistema
│   ├── database_schema.md # Esquema de base de datos
│   ├── requerimientos.md  # Requerimientos funcionales
│   └── wireframes.png     # Diseño de interfaz
└── README.md              # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Python 3.11+
- Node.js 18+
- pnpm o npm

### Backend (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

### Frontend (React)
```bash
cd frontend
pnpm install  # o npm install
pnpm run dev  # o npm run dev
```

### Configuración de Base de Datos
La base de datos SQLite se crea automáticamente al ejecutar la aplicación por primera vez.

**Usuario administrador por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

## 🌐 Despliegue

El sistema está configurado para despliegue en producción:

### URL de Producción
**https://8xhpiqcvkpn9.manus.space**

### Build de Producción
```bash
# Frontend
cd frontend
pnpm run build
cp -r dist/* ../backend/src/static/

# Backend
cd backend
python src/main.py
```

## 📋 Uso del Sistema

### 1. Configuración Inicial
1. Crear farmacias de la red
2. Configurar usuarios y permisos
3. Agregar proveedores con términos financieros

### 2. Gestión de Inventarios
1. Subir inventarios por farmacia usando archivos Excel
2. Formato requerido: Código, Descripción, Laboratorio, etc.
3. El sistema procesa y valida automáticamente

### 3. Análisis y Reportes
1. **Vista Consolidada**: Ver totales por producto
2. **Lista Comparativa**: Comparar precios entre proveedores
3. **Reportes de Falla**: Identificar productos para reposición

### 4. Operaciones Diarias
1. Buscar medicamentos entre farmacias
2. Procesar ventas con carrito de compras
3. Generar reportes de análisis

## 🔧 Características Técnicas

### Seguridad
- Autenticación basada en sesiones
- Contraseñas encriptadas con hash
- Control de acceso por roles y permisos
- Validación de datos en frontend y backend

### Rendimiento
- Consultas optimizadas con SQLAlchemy
- Carga lazy de componentes React
- Compresión de assets en producción
- Índices de base de datos para búsquedas rápidas

### Escalabilidad
- Arquitectura modular
- API REST bien estructurada
- Separación clara frontend/backend
- Base de datos normalizada

## 📞 Soporte y Contacto

**Desarrollado para Grupo Drocolven**

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

## 📄 Licencia

Sistema propietario desarrollado específicamente para Grupo Drocolven.

---

**© 2025 Grupo Drocolven - Sistema de Gestión de Farmacias**

<!-- Cambio forzado para Vercel -->

