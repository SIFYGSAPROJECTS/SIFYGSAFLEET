import { prisma } from "../db";

// Calcula el total de unidades en el inventario y segmenta por estatus (activos/inactivos)
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

// Agrupa las unidades por estado operativo y determina cuántas están disponibles sin asignación
export async function get_fleet_status_summary(empresa_flota?: string) {
  const whereClause: any = {};
  if (empresa_flota && !['todas', 'total', 'activa', 'activos', 'general', 'flota'].includes(empresa_flota.toLowerCase())) {
    whereClause.Consecutivo = { startsWith: empresa_flota + '-', mode: 'insensitive' };
  }

  const stats = await prisma.inventario_Automoviles.groupBy({
    by: ['Estatus_Operativo'],
    where: whereClause,
    _count: { Consecutivo: true }
  });
  
  const disponibles = await prisma.inventario_Automoviles.count({
    where: {
      ...whereClause,
      Estatus_Operativo: 'Activo en flota',
      OR: [{ Email_encargado: null }, { Email_encargado: "" }]
    }
  });

  return { stats, disponibles, empresa: empresa_flota || 'Todas' };
}

// Obtiene un reporte detallado del inventario de flota incluyendo datos del encargado
export async function get_fleet_report(empresa_flota?: string, estatus?: string) {
  const whereClause: any = {};
  if (empresa_flota && !['todas', 'total', 'activa', 'activos', 'general', 'flota'].includes(empresa_flota.toLowerCase())) {
    whereClause.Consecutivo = { startsWith: empresa_flota + '-', mode: 'insensitive' };
  }

  if (estatus && estatus.toLowerCase() !== 'todos') {
    if (estatus.toLowerCase().includes('activ')) {
      whereClause.Estatus_Operativo = 'Activo en flota';
    } else if (estatus.toLowerCase().includes('baja') || estatus.toLowerCase().includes('inactiv')) {
      whereClause.Estatus_Operativo = 'Dado de baja';
    } else if (estatus.toLowerCase().includes('repara') || estatus.toLowerCase().includes('taller')) {
      whereClause.Estatus_Operativo = 'En Reparación';
    } else if (estatus.toLowerCase().includes('siniestrad')) {
      whereClause.Estatus_Operativo = 'Siniestrado';
    }
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

// Recupera información completa de una unidad específica, incluyendo su bitácora y último servicio
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

// Genera estadísticas de distribución de la flota por ubicación y departamento
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

// Obtiene el listado de unidades operativas que no tienen un empleado asignado
export async function get_unassigned_units() {
  return await prisma.inventario_Automoviles.findMany({
    where: { OR: [{ Email_encargado: null }, { Email_encargado: "" }] },
    select: { Consecutivo: true, Placa: true, Marca: true, Modelo: true, Estatus_Operativo: true, Ubicacion: true }
  });
}

// Búsqueda avanzada de unidades con filtros dinámicos (estatus, asignación, departamento)
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
    whereClause.encargado = { isNot: null };
  } else if (filtros.asignado === false) {
    whereClause.encargado = { is: null };
  }

  return await prisma.inventario_Automoviles.findMany({
    where: whereClause,
    include: {
      encargado: { select: { Nombre_Empleado: true, A_Paterno: true } }
    }
  });
}

// Consulta los tickets de servicio más recientes creados en el sistema
export async function get_recent_tickets() {
  return await prisma.solicitud.findMany({
    orderBy: { Fecha_Realizacion: 'desc' },
    take: 10,
    select: { Pk_folio_ticket: true, Consecutivo: true, Tipo_Servicio: true, Estado: true, Fecha_Realizacion: true }
  });
}

// Obtiene el directorio corporativo de empleados aplicando filtros opcionales
export async function get_employee_directory(filtros: { departamento?: string, cargo?: string, estatus?: string, nombre?: string }) {
  const Clause: any = {};
  
  if (filtros.departamento) Clause.Departamento = { contains: filtros.departamento, mode: 'insensitive' };
  if (filtros.cargo) Clause.Cargo = { contains: filtros.cargo, mode: 'insensitive' };
  if (filtros.estatus) Clause.Estatus_Acceso = { contains: filtros.estatus, mode: 'insensitive' };
  if (filtros.nombre) {
    Clause.OR = [
      { Nombre_Empleado: { contains: filtros.nombre, mode: 'insensitive' } },
      { A_Paterno: { contains: filtros.nombre, mode: 'insensitive' } }
    ];
  }

  return await prisma.empleados.findMany({
    where: Clause,
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

// Genera estadísticas operativas sobre los empleados registrados
export async function get_employee_stats() {
  const byDepartamento = await prisma.empleados.groupBy({
    by: ['Departamento'],
    _count: { Email: true }
  });
  
  const totalActivos = await prisma.empleados.count({ where: { Estatus_Acceso: 'Activo' } });
  const total = await prisma.empleados.count();
  
  return { total, totalActivos, byDepartamento };
}

// Recupera las revisiones (checklists) realizadas, filtrando opcionalmente por vehículo
export async function get_checklists(consecutivo?: string) {
  if (!consecutivo) {
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

// Obtiene el historial de mantenimientos para una unidad específica
export async function get_unit_tickets(consecutivo: string) {
  return await prisma.solicitud.findMany({
    where: { Consecutivo: { contains: consecutivo, mode: 'insensitive' } },
    orderBy: { Fecha_Realizacion: 'desc' },
    include: {
      empleado: { select: { Nombre_Empleado: true, A_Paterno: true } }
    }
  });
}

// Consulta la bitácora histórica general de una unidad
export async function get_unit_history(consecutivo: string) {
  return await prisma.historial_Auto.findMany({
    where: { Consecutivo: { contains: consecutivo, mode: 'insensitive' } },
    orderBy: { Fecha_Registro: 'desc' }
  });
}

// Consulta el historial de reasignaciones (empleados) de un vehículo
export async function get_unit_assignment_history(consecutivo: string) {
  return await prisma.historial_Registro_Automovil.findMany({
    where: { Consecutivo: { contains: consecutivo, mode: 'insensitive' } },
    orderBy: { Fecha_Cambio: 'desc' },
    include: {
      empleado: { select: { Nombre_Empleado: true, A_Paterno: true } }
    }
  });
}

// Recupera la información detallada de una solicitud de servicio por su folio
export async function get_ticket_details(folio: string) {
  return await prisma.solicitud.findUnique({
    where: { Pk_folio_ticket: folio },
    include: {
      procesos: { orderBy: { Fecha_Hora: 'desc' } },
      auto: { select: { Placa: true, Marca: true, Modelo: true } }
    }
  });
}

// Busca solicitudes de servicio pendientes utilizando términos de coincidencia amplios o específicos
export async function get_pending_services(query?: string) {
  const whereClause: any = {};
  const q = (query || "").toLowerCase().trim();
  
  const broadKeywords = ["programado", "programados", "cita", "citas", "taller", 
    "pendiente", "pendientes", "servicio", "servicios", "seguimiento", "activo", 
    "activos", "proceso", "mantenimiento", "abril", "mayo", "mes", "todos", ""];
  
  const isBroadSearch = !q || q === "undefined" || broadKeywords.some(kw => q.includes(kw));

  if (isBroadSearch) {
    whereClause.NOT = { Estado: 'LISTO' };
  } else {
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

// Cuenta la cantidad de tickets agrupados por su estado operativo actual
export async function get_services_summary() {
  return await prisma.solicitud.groupBy({
    by: ['Estado'],
    _count: { Pk_folio_ticket: true }
  });
}

// Identifica riesgos operativos en la flota (ausencia de seguros y alta demanda de servicios)
export async function get_fleet_alerts() {
  const sinSeguro = await prisma.inventario_Automoviles.findMany({
    where: { Poliza_Seguro: null },
    select: { Consecutivo: true, Placa: true }
  });
  
  const pendientes = await prisma.solicitud.count({ where: { Estado: 'PENDIENTE' } });
  
  return { sinSeguro, pendientesCount: pendientes };
}
