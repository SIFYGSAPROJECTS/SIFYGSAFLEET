import { prisma } from "../db";

export async function get_inventory_summary(empresa_flota?: string) {
  const whereClause: any = {};
  if (empresa_flota && empresa_flota !== 'Todas') {
    whereClause.Consecutivo = { startsWith: empresa_flota + '-', mode: 'insensitive' };
  }

  const total = await prisma.inventario_Automoviles.count({ where: whereClause });
  const activos = await prisma.inventario_Automoviles.count({ 
    where: { ...whereClause, Estado_Unidad: true } 
  });
  const inactivos = total - activos;
  
  return { total, activos, inactivos, empresa: empresa_flota || 'TODAS' };
}

export async function get_fleet_status_summary(empresa_flota?: string) {
  const whereClause: any = {};
  if (empresa_flota && empresa_flota !== 'Todas') {
    whereClause.Consecutivo = { startsWith: empresa_flota + '-', mode: 'insensitive' };
  }

  const stats = await prisma.inventario_Automoviles.groupBy({
    by: ['Estatus_Operativo'],
    where: whereClause,
    _count: { Consecutivo: true }
  });
  
  // Contar disponibles (Activo en flota y sin encargado)
  const disponibles = await prisma.inventario_Automoviles.count({
    where: {
      ...whereClause,
      Estatus_Operativo: 'Activo en flota',
      OR: [{ Email_encargado: null }, { Email_encargado: "" }]
    }
  });

  return { stats, disponibles, empresa: empresa_flota || 'Todas' };
}

export async function get_fleet_report(empresa_flota?: string) {
  const whereClause: any = {};
  if (empresa_flota && empresa_flota !== 'Todas') {
    whereClause.Consecutivo = { startsWith: empresa_flota + '-', mode: 'insensitive' };
  }

  return await prisma.inventario_Automoviles.findMany({
    where: whereClause,
    include: {
      encargado: {
        select: { Nombre_Empleado: true, A_Paterno: true, Cargo: true, Departamento: true }
      }
    }
  });
}

export async function get_unit_details(identificador: string) {
  return await prisma.inventario_Automoviles.findFirst({
    where: {
      OR: [
        { Placa: { contains: identificador, mode: 'insensitive' } },
        { Consecutivo: { contains: identificador, mode: 'insensitive' } }
      ]
    },
    include: {
      encargado: {
        select: { Nombre_Empleado: true, A_Paterno: true, Email: true }
      },
      bitacora_autos: {
        orderBy: { Fecha_Registro: 'desc' },
        take: 1,
        select: { Kilometraje: true, Fecha_Registro: true, Descripcion: true }
      },
      solicitudes: {
        orderBy: { Fecha_Realizacion: 'desc' },
        take: 1,
        select: { Kilometraje: true, Fecha_Realizacion: true, Tipo_Servicio: true }
      }
    }
  });
}

export async function get_fleet_stats() {
  const byUbicacion = await prisma.inventario_Automoviles.groupBy({
    by: ['Ubicacion'],
    _count: { Consecutivo: true }
  });
  const byDepartamento = await prisma.inventario_Automoviles.groupBy({
    by: ['Departamento'],
    _count: { Consecutivo: true }
  });
  
  return { byUbicacion, byDepartamento };
}

export async function get_unassigned_units() {
  return await prisma.inventario_Automoviles.findMany({
    where: { OR: [{ Email_encargado: null }, { Email_encargado: "" }] },
    select: { Consecutivo: true, Placa: true, Marca: true, Modelo: true, Estatus_Operativo: true, Ubicacion: true }
  });
}

export async function get_dynamic_units(filtros: { empresa_flota?: string, departamento?: string, estatus?: string, ubicacion?: string, asignado?: boolean }) {
  const whereClause: any = {};
  
  if (filtros.empresa_flota) {
    whereClause.Consecutivo = { startsWith: filtros.empresa_flota, mode: 'insensitive' };
  }
  if (filtros.departamento) {
    whereClause.Departamento = { contains: filtros.departamento, mode: 'insensitive' };
  }
  if (filtros.estatus) {
    whereClause.Estatus_Operativo = { contains: filtros.estatus, mode: 'insensitive' };
  }
  if (filtros.ubicacion) {
    whereClause.Ubicacion = { contains: filtros.ubicacion, mode: 'insensitive' };
  }
  if (filtros.asignado === true) {
    // Solo trae autos cuyo encargado exista realmente en la tabla Empleados
    whereClause.encargado = { isNot: null };
  } else if (filtros.asignado === false) {
    // Trae autos que no tienen a nadie en la tabla Empleados
    whereClause.encargado = { is: null };
  }

  return await prisma.inventario_Automoviles.findMany({
    where: whereClause,
    include: {
      encargado: { select: { Nombre_Empleado: true, A_Paterno: true } }
    }
  });
}

export async function get_recent_tickets() {
  return await prisma.solicitud.findMany({
    orderBy: { Fecha_Realizacion: 'desc' },
    take: 10,
    select: { Pk_folio_ticket: true, Consecutivo: true, Tipo_Servicio: true, Estado: true, Fecha_Realizacion: true }
  });
}

// === NUEVOS MÓDULOS DE EMPLEADOS ===

export async function get_employee_directory(filtros: { departamento?: string, cargo?: string, estatus?: string, nombre?: string }) {
  const whereClause: any = {};
  
  if (filtros.departamento) whereClause.Departamento = { contains: filtros.departamento, mode: 'insensitive' };
  if (filtros.cargo) whereClause.Cargo = { contains: filtros.cargo, mode: 'insensitive' };
  if (filtros.estatus) whereClause.Estatus_Acceso = { contains: filtros.estatus, mode: 'insensitive' };
  if (filtros.nombre) {
    whereClause.OR = [
      { Nombre_Empleado: { contains: filtros.nombre, mode: 'insensitive' } },
      { A_Paterno: { contains: filtros.nombre, mode: 'insensitive' } }
    ];
  }

  return await prisma.empleados.findMany({
    where: whereClause,
    select: {
      Email: true,
      Nombre_Empleado: true,
      A_Paterno: true,
      Departamento: true,
      Cargo: true,
      Estatus_Acceso: true,
      Rol: true
    }
  });
}

export async function get_employee_stats() {
  const byDepartamento = await prisma.empleados.groupBy({
    by: ['Departamento'],
    _count: { Email: true }
  });
  
  const totalActivos = await prisma.empleados.count({ where: { Estatus_Acceso: 'Activo' } });
  const total = await prisma.empleados.count();
  
  return { total, totalActivos, byDepartamento };
}

export async function get_checklists(consecutivo?: string) {
  if (!consecutivo) {
    // Si no se pide una unidad específica, devolvemos una lista de unidades que TIENEN checklists
    const unitsWithChecklists = await prisma.checklist.findMany({
      select: { Consecutivo: true, Titulo: true, Fecha_Subida: true },
      distinct: ['Consecutivo'],
      orderBy: { Fecha_Subida: 'desc' }
    });
    return unitsWithChecklists;
  }

  return await prisma.checklist.findMany({
    where: { Consecutivo: { contains: consecutivo, mode: 'insensitive' } },
    orderBy: { Fecha_Subida: 'desc' }
  });
}

export async function get_unit_tickets(consecutivo: string) {
  return await prisma.solicitud.findMany({
    where: { Consecutivo: { contains: consecutivo, mode: 'insensitive' } },
    orderBy: { Fecha_Realizacion: 'desc' },
    include: {
      empleado: { select: { Nombre_Empleado: true, A_Paterno: true } }
    }
  });
}
export async function get_unit_history(consecutivo: string) {
  return await prisma.historial_Auto.findMany({
    where: { Consecutivo: { contains: consecutivo, mode: 'insensitive' } },
    orderBy: { Fecha_Registro: 'desc' }
  });
}

// === NUEVOS MÓDULOS PARA ADAPTABILIDAD 100% ===

export async function get_unit_assignment_history(consecutivo: string) {
  return await prisma.historial_Registro_Automovil.findMany({
    where: { Consecutivo: { contains: consecutivo, mode: 'insensitive' } },
    orderBy: { Fecha_Cambio: 'desc' },
    include: {
      empleado: { select: { Nombre_Empleado: true, A_Paterno: true } }
    }
  });
}

export async function get_ticket_details(folio: string) {
  return await prisma.solicitud.findUnique({
    where: { Pk_folio_ticket: folio },
    include: {
      procesos: { orderBy: { Fecha_Hora: 'desc' } },
      auto: { select: { Placa: true, Marca: true, Modelo: true } }
    }
  });
}

export async function get_pending_services(query?: string) {
  const whereClause: any = {};
  const q = (query || "").toLowerCase().trim();
  
  // Palabras que indican "dame todo lo activo"
  const broadKeywords = ["programado", "programados", "cita", "citas", "taller", 
    "pendiente", "pendientes", "servicio", "servicios", "seguimiento", "activo", 
    "activos", "proceso", "mantenimiento", "abril", "mayo", "mes", "todos", ""];
  
  // Es búsqueda amplia si: no hay query, está vacía, o CONTIENE alguna palabra común
  const isBroadSearch = !q || q === "undefined" || broadKeywords.some(kw => q.includes(kw));

  if (isBroadSearch) {
    // Traer todo lo que NO esté terminado (LISTO)
    whereClause.NOT = { Estado: 'LISTO' };
  } else {
    // Búsqueda específica (ej. un folio concreto)
    whereClause.OR = [
      { Estado: { contains: query, mode: 'insensitive' } },
      { Tipo_Servicio: { contains: query, mode: 'insensitive' } },
      { Lugar_Cita: { contains: query, mode: 'insensitive' } },
      { Descripcion: { contains: query, mode: 'insensitive' } },
      { Pk_folio_ticket: { contains: query, mode: 'insensitive' } }
    ];
  }

  return await prisma.solicitud.findMany({
    where: whereClause,
    orderBy: { Fecha_Realizacion: 'desc' },
    include: {
      auto: { select: { Placa: true, Ubicacion: true, Marca: true, Modelo: true } }
    }
  });
}

export async function get_services_summary() {
  return await prisma.solicitud.groupBy({
    by: ['Estado'],
    _count: { Pk_folio_ticket: true }
  });
}

export async function get_fleet_alerts() {
  // Unidades con estatus no operativo o con muchos tickets
  const sinSeguro = await prisma.inventario_Automoviles.findMany({
    where: { Poliza_Seguro: null },
    select: { Consecutivo: true, Placa: true }
  });
  
  const pendientes = await prisma.solicitud.count({ where: { Estado: 'PENDIENTE' } });
  
  return { sinSeguro, pendientesCount: pendientes };
}
