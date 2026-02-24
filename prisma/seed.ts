import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log(' Iniciando la carga de datos...')

  // 1. Crear tu usuario (Admin)
// 1. Crear tu usuario (ADMIN - Jefe Supremo)
  const mike = await prisma.empleados.upsert({
    where: { Email: 'mike.mendez@sifygsa.com' },
    update: { 
      Rol: 'ADMIN' // <--- ¡Esto es lo nuevo! Si ya existes, te asciende a Admin.
    },
    create: {
      Email: 'mike.mendez@sifygsa.com',
      Nombre_Empleado: 'Mike',
      A_Paterno: 'Mendez',
      Cargo: 'Jefe de Sistemas',
      Departamento: 'TI',
      Rol: 'ADMIN', 
    },

  });

  // 2. Crear un usuario de prueba (EMPLEADO - Acceso Limitado)
  const empleado = await prisma.empleados.upsert({
    where: { Email: 'empleado@sifygsa.com' },
    update: { Rol: 'USER' },
    create: {
      Email: 'empleado@sifygsa.com',
      Nombre_Empleado: 'Juan',
      A_Paterno: 'Pérez',
      Cargo: 'Chofer',
      Departamento: 'Operaciones',
      Rol: 'USER', // <--- Este rol ve menos cosas
    },
  });
  // --- PRUEBA DE CORREO: NUEVO USUARIO Y VEHÍCULO ---
  const correoPrueba = 'mike.mendez2908@gmail.com'; // <--- PON TU CORREO AQUÍ

  // 1. Inyectamos al nuevo empleado
  await prisma.empleados.upsert({
    where: { Email: correoPrueba },
    update: { Rol: 'USER' },
    create: {
      Email: correoPrueba,
      Nombre_Empleado: 'Usuario',
      A_Paterno: 'Prueba',
      Cargo: 'Chofer',
      Departamento: 'Operaciones',
      Rol: 'USER'
    }
  });

  // 2. Inyectamos un auto y le damos las llaves a ese correo
  await prisma.inventario_Automoviles.upsert({
    where: { Consecutivo: 'V-99' }, // Usamos el 99 para que no choque con los otros
    update: { Email_encargado: correoPrueba }, 
    create: {
      Consecutivo: 'V-99',
      Marca: 'Honda',
      Modelo: 'Civic',
      Placa: 'PRU-1234',
      Email_encargado: correoPrueba // <--- Aquí ocurre la magia de la asignación
    }
  });

  console.log(`✅ Empleado de prueba y unidad V-99 asignados a: ${correoPrueba}`);
  console.log(` Usuario creado: ${mike.Nombre_Empleado}`)
  // --- 3. CREAR BATERÍA DE 10 USUARIOS DE PRUEBA ---
  console.log('Generando 10 usuarios de prueba...');

  const usuariosNuevos = [
    { Email: 'chofer1@sifygsa.com', Nombre_Empleado: 'Carlos', A_Paterno: 'Ruiz', Cargo: 'Chofer', Departamento: 'Operaciones', Rol: 'USER' },
    { Email: 'chofer2@sifygsa.com', Nombre_Empleado: 'Luis', A_Paterno: 'García', Cargo: 'Operador', Departamento: 'Logística', Rol: 'USER' },
    { Email: 'chofer3@sifygsa.com', Nombre_Empleado: 'Roberto', A_Paterno: 'Gómez', Cargo: 'Chofer', Departamento: 'Operaciones', Rol: 'USER' },
    { Email: 'mecanico1@sifygsa.com', Nombre_Empleado: 'Hugo', A_Paterno: 'Sánchez', Cargo: 'Mecánico', Departamento: 'Taller', Rol: 'USER' },
    { Email: 'operador1@sifygsa.com', Nombre_Empleado: 'Martín', A_Paterno: 'López', Cargo: 'Operador', Departamento: 'Logística', Rol: 'USER' },
    { Email: 'chofer4@sifygsa.com', Nombre_Empleado: 'José', A_Paterno: 'Martínez', Cargo: 'Chofer', Departamento: 'Operaciones', Rol: 'USER' },
    { Email: 'chofer5@sifygsa.com', Nombre_Empleado: 'Pedro', A_Paterno: 'Ramírez', Cargo: 'Chofer', Departamento: 'Operaciones', Rol: 'USER' },
    { Email: 'operador2@sifygsa.com', Nombre_Empleado: 'Jorge', A_Paterno: 'Hernández', Cargo: 'Operador', Departamento: 'Logística', Rol: 'USER' },
    { Email: 'chofer6@sifygsa.com', Nombre_Empleado: 'Miguel', A_Paterno: 'Torres', Cargo: 'Chofer', Departamento: 'Operaciones', Rol: 'USER' },
    { Email: 'mecanico2@sifygsa.com', Nombre_Empleado: 'Fernando', A_Paterno: 'Flores', Cargo: 'Mecánico', Departamento: 'Taller', Rol: 'USER' }
  ];

  for (const usuario of usuariosNuevos) {
    await prisma.empleados.upsert({
      where: { Email: usuario.Email },
      update: {}, // Si ya existen, no hace nada
      create: {
        ...usuario,
        // Si tu base de datos requiere una contraseña obligatoria, descomenta la siguiente línea:
        // Password: '123456' 
      },
    });
  }
  
  console.log('¡10 usuarios inyectados a la base de datos con éxito! 🚀');

  // 2. Crear un vehículo (V-01) asignado a ti
  const unidad01 = await prisma.inventario_Automoviles.upsert({
    where: { Consecutivo: 'V-01' },
    update: {},
    create: {
      Consecutivo: 'V-01',
      Placa: 'SFG-2026',
      Marca: 'Ford',
      Modelo: 'Explorer',
      Color: 'Negro',
      Linea: 'XLT',
      Email_encargado: 'mike.mendez@sifygsa.com', // Aquí probamos la relación
    },
  })
  console.log(` Vehículo creado: ${unidad01.Marca} ${unidad01.Modelo}`)
  // --- 4. CREAR BATERÍA DE 10 VEHÍCULOS DE PRUEBA Y ASIGNARLOS ---
  console.log('Generando 10 vehículos de prueba en el estacionamiento...');

  const vehiculosNuevos = [
    { Consecutivo: 'V-02', Marca: 'Nissan', Modelo: 'NP300', Placa: 'XAL-1234', Email_encargado: 'chofer1@sifygsa.com' },
    { Consecutivo: 'V-03', Marca: 'Toyota', Modelo: 'Hilux', Placa: 'VER-5678', Email_encargado: 'chofer2@sifygsa.com' },
    { Consecutivo: 'V-04', Marca: 'Chevrolet', Modelo: 'Silverado', Placa: 'BOC-9012', Email_encargado: 'chofer3@sifygsa.com' },
    { Consecutivo: 'V-05', Marca: 'Ford', Modelo: 'F-150', Placa: 'MIN-3456', Email_encargado: 'chofer4@sifygsa.com' },
    { Consecutivo: 'V-06', Marca: 'Nissan', Modelo: 'Versa', Placa: 'COA-7890', Email_encargado: 'chofer5@sifygsa.com' },
    { Consecutivo: 'V-07', Marca: 'Volkswagen', Modelo: 'Jetta', Placa: 'XAL-2468', Email_encargado: 'chofer6@sifygsa.com' },
    { Consecutivo: 'V-08', Marca: 'Kenworth', Modelo: 'T680', Placa: 'FED-1357', Email_encargado: 'operador1@sifygsa.com' },
    { Consecutivo: 'V-09', Marca: 'Freightliner', Modelo: 'Cascadia', Placa: 'FED-9753', Email_encargado: 'operador2@sifygsa.com' },
    { Consecutivo: 'V-10', Marca: 'Toyota', Modelo: 'Hiace', Placa: 'VER-1122', Email_encargado: 'mecanico1@sifygsa.com' },
    { Consecutivo: 'V-11', Marca: 'Ford', Modelo: 'Transit', Placa: 'BOC-3344', Email_encargado: 'mecanico2@sifygsa.com' }
  ];

  // (Nota: Si tu base de datos requiere otros campos obligatorios como 'Anio' o 'Color', 
  // puedes agregarlos fácilmente en la lista de arriba)

  for (const auto of vehiculosNuevos) {
    await prisma.inventario_Automoviles.upsert({
      where: { Consecutivo: auto.Consecutivo },
      update: {}, // Si ya existe, lo deja igual
      create: auto,
    });
  }

  console.log('¡10 vehículos estacionados y asignados con éxito! 🚙🔑');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })