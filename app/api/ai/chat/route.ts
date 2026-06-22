import { NextResponse } from "next/server";
import {
  get_unit_details,
  get_fleet_status_summary,
  get_fleet_report,
  get_fleet_costs,
  predict_upcoming_services,
  audit_checklist_compliance,
  get_pending_services,
  get_my_unit,
  get_employee_directory,
  get_employee_stats,
  get_computo_inventory,
  get_caja_chica_records
} from "@/lib/ai/ai-actions";
import { generateExcelBase64 } from "@/lib/ai/excel-generator";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCookieValue(cookieHeader: string, name: string): string {
  const match = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

// ─── Prompts por rol ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT_ADMIN = `
Eres SIFY Asistente IA, el copiloto inteligente de flota para administradores.

REGLA CRÍTICA PARA EXCEL:
1. Si el usuario pide un "reporte", "Excel" o "lista", DEBES usar herramientas que devuelvan listas de datos como 'get_fleet_report' o 'get_pending_services'.
2. NO uses herramientas de resumen (como 'get_fleet_status_summary') si te piden un Excel.
3. El sistema generará el botón de descarga automáticamente si devuelves una lista de más de 1 elemento.

RESPUESTA A PREGUNTAS GENERALES DE CAPACIDADES ("¿En qué ayudas?", "¿Qué puedes hacer?"):
Responde de forma estructurada que puedes ayudar con:
1. **Inventario y Estado de Flota**: Consultar autos activos, inactivos y asignaciones de empleados.
2. **Rastreo de Tickets y Servicios**: Ver servicios pendientes, estado de tickets y mantenimientos recientes.
3. **Análisis de Costos**: Obtener reportes de gastos de mantenimiento de la flota o por empresa.
4. **Predicción de Servicios**: Analizar kilometraje para predecir qué vehículos necesitarán servicio pronto.
5. **Auditoría de Checklists**: Revisar qué vehículos activos no han entregado su checklist en el último mes.
6. **Directorio de Empleados**: Consultar lista y estado de los empleados registrados.
7. **Equipos de Cómputo**: Ver inventario de equipos tecnológicos (laptops, celulares) asignados.
8. **Gastos (Caja Chica)**: Consultar registros de caja chica de los empleados.
IMPORTANTE: No puedes alterar datos ni modificar tickets, solo eres una herramienta de consulta analítica y gerencial.

PERSONALIDAD: Breve, directo y profesional.
`;

function buildUserPrompt(userName: string): string {
  return `
Eres SIFY Asistente IA, el asistente personal del conductor ${userName}.

ROL Y ALCANCE — MUY IMPORTANTE:
- Tu único trabajo es ayudar al conductor con información de SU PROPIA unidad asignada.
- Cuando necesites datos del vehículo o servicios, SIEMPRE usa la herramienta 'get_my_unit'. No necesitas preguntarle al usuario su placa ni su consecutivo.
- NUNCA muestres información de otros vehículos, otros empleados, flotas completas, costos globales ni reportes generales.
- Si el usuario pide algo fuera de su unidad (reportes de flota, datos de otros, costos totales, listados de empleados), responde amablemente: "Solo tengo acceso a la información de tu unidad asignada. Para consultas de flota completa, contacta a un administrador."

RESPUESTA A PREGUNTAS GENERALES DE CAPACIDADES:
Puedes ayudar con:
1. **Tu unidad asignada**: Placa, modelo, kilometraje actual y estado operativo.
2. **Historial de servicios**: Ver tus últimos mantenimientos y el estado de tus tickets.
3. **Checklists recientes**: Ver si has subido tus revisiones recientes.

PERSONALIDAD: Amigable, directo y orientado al conductor.
`;
}

// ─── Herramientas por rol ────────────────────────────────────────────────────

const TOOLS_ADMIN = [
  {
    type: "function",
    function: {
      name: "get_fleet_report",
      description: "Obtener LISTA DETALLADA para generar REPORTES EXCEL de unidades y conductores.",
      parameters: {
        type: "object",
        properties: {
          empresa_flota: { type: "string", description: "Opcional. Prefijo de empresa (Ej. AVH). Usa 'Todas' si piden flota total." },
          estatus: { type: "string", description: "Opcional. Filtro de estatus. Usa 'Todos' por defecto." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pending_services",
      description: "Obtener LISTA DETALLADA de servicios para Excel.",
      parameters: { type: "object", properties: { query: { type: "string" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_fleet_status_summary",
      description: "Ver conteos rápidos de flota (Texto). NO sirve para Excel.",
      parameters: {
        type: "object",
        properties: {
          empresa_flota: { type: "string", description: "Opcional. Prefijo de empresa (Ej. AVH)." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_unit_details",
      description: "Ver datos de un auto específico por placa o consecutivo.",
      parameters: { type: "object", properties: { identificador: { type: "string" } }, required: ["identificador"] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_fleet_costs",
      description: "Obtener la suma total de costos de mantenimiento de la flota.",
      parameters: { type: "object", properties: { empresa: { type: "string", description: "Opcional. Prefijo de empresa (Ej. AVH)." } } }
    }
  },
  {
    type: "function",
    function: {
      name: "predict_upcoming_services",
      description: "Predice qué vehículos necesitarán mantenimiento pronto analizando su kilometraje.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "audit_checklist_compliance",
      description: "Revisa qué vehículos activos no han subido su revisión de checklist en los últimos 30 días.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_employee_directory",
      description: "Obtener el directorio o lista de empleados registrados.",
      parameters: { type: "object", properties: { departamento: { type: "string" }, cargo: { type: "string" }, nombre: { type: "string" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_employee_stats",
      description: "Obtener conteo rápido de empleados (totales y activos).",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_computo_inventory",
      description: "Ver inventario de equipos de cómputo y celulares. Ideal para Excel.",
      parameters: { type: "object", properties: { estatus: { type: "string" }, empresa: { type: "string" } } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_caja_chica_records",
      description: "Obtener los gastos y abonos de caja chica de los empleados.",
      parameters: { type: "object", properties: { email: { type: "string" }, semana: { type: "number" }, anio: { type: "number" } } }
    }
  }
];

const TOOLS_USER = [
  {
    type: "function",
    function: {
      name: "get_my_unit",
      description: "Obtiene la información completa de la unidad asignada al conductor logueado: datos del vehículo, historial de servicios, bitácora de kilometraje y checklists recientes. Úsala siempre que el usuario pregunte sobre su vehículo, servicios o checklists.",
      parameters: { type: "object", properties: {} }
    }
  }
];

// ─── Groq API ────────────────────────────────────────────────────────────────

async function callGroq(messages: any[], tools?: any[], temp = 0) {
  const body: any = {
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: temp,
    max_tokens: 1024
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
  return await response.json();
}

// ─── Handler Principal ───────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages, contextPath } = await req.json();
    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    if (!GROQ_API_KEY) return NextResponse.json({ text: "Error: API Key no configurada." }, { status: 200 });

    // Leer rol y email desde las cookies de sesión (servidor — no se puede falsificar desde el cliente)
    const cookieHeader = req.headers.get("cookie") || "";
    const userRole = getCookieValue(cookieHeader, "user_role");
    const userEmail = getCookieValue(cookieHeader, "user_email");
    const userName = getCookieValue(cookieHeader, "user_name") || "conductor";

    const isAdmin = ['admin', 'gerencial'].includes(userRole.toLowerCase());

    // Seleccionar prompt y herramientas según rol
    let systemPrompt = isAdmin ? SYSTEM_PROMPT_ADMIN : buildUserPrompt(userName);
    let tools = isAdmin ? TOOLS_ADMIN : TOOLS_USER;

    // Routing Semántico: Restringir herramientas si no estamos en el dashboard principal
    if (isAdmin && contextPath && contextPath !== '/' && contextPath !== '/dashboard') {
      // 1. Control Vehicular (Flota, Servicios, Tickets, Costos de Mantenimiento)
      if (contextPath.includes('/vehiculos') || contextPath.includes('/tickets') || contextPath.includes('/servicios') || contextPath.includes('/flota') || contextPath.includes('/costos')) {
        tools = TOOLS_ADMIN.filter(t => ["get_fleet_report", "get_pending_services", "get_fleet_status_summary", "get_unit_details", "audit_checklist_compliance", "predict_upcoming_services", "get_fleet_costs"].includes(t.function.name));
        systemPrompt = systemPrompt.replace(/6\. \*\*Directorio de Empleados.*|7\. \*\*Equipos de Cómputo.*|8\. \*\*Gastos \(Caja Chica\).*/g, '');
      
      // 2. Personal / Empleados (Programa Anual, Usuarios)
      } else if (contextPath.includes('/empleados') || contextPath.includes('/usuarios') || contextPath.includes('/programa')) {
        tools = TOOLS_ADMIN.filter(t => ["get_employee_directory", "get_employee_stats"].includes(t.function.name));
        systemPrompt = systemPrompt.replace(/1\. \*\*Inventario y Estado de Flota.*|2\. \*\*Rastreo de Tickets.*|3\. \*\*Análisis de Costos.*|4\. \*\*Predicción de Servicios.*|5\. \*\*Auditoría de Checklists.*|7\. \*\*Equipos de Cómputo.*|8\. \*\*Gastos \(Caja Chica\).*/g, '');
      
      // 3. Activos TI
      } else if (contextPath.includes('/computo') || contextPath.includes('/ti')) {
        tools = TOOLS_ADMIN.filter(t => ["get_computo_inventory"].includes(t.function.name));
        systemPrompt = systemPrompt.replace(/1\. \*\*Inventario y Estado de Flota.*|2\. \*\*Rastreo de Tickets.*|3\. \*\*Análisis de Costos.*|4\. \*\*Predicción de Servicios.*|5\. \*\*Auditoría de Checklists.*|6\. \*\*Directorio de Empleados.*|8\. \*\*Gastos \(Caja Chica\).*/g, '');
      
      // 4. Gastos Generales (Caja Chica)
      } else if (contextPath.includes('/gastos') || contextPath.includes('/caja-chica')) {
        tools = TOOLS_ADMIN.filter(t => ["get_caja_chica_records"].includes(t.function.name));
        systemPrompt = systemPrompt.replace(/1\. \*\*Inventario y Estado de Flota.*|2\. \*\*Rastreo de Tickets.*|3\. \*\*Análisis de Costos.*|4\. \*\*Predicción de Servicios.*|5\. \*\*Auditoría de Checklists.*|6\. \*\*Directorio de Empleados.*|7\. \*\*Equipos de Cómputo.*/g, '');
      }
    }

    // Construir historial para Groq
    let aiMessages: any[] = [{ role: "system", content: systemPrompt }];
    const recentMessages = messages.slice(-5);
    for (const msg of recentMessages) {
      aiMessages.push({ role: msg.role === "model" ? "assistant" : "user", content: msg.content || "" });
    }

    const completion = await callGroq(aiMessages, tools, 0);
    const messageResponse = completion.choices[0].message;

    let text = messageResponse.content || "";
    let excelBase64 = null;
    let fileUrl = null;
    let fileName = null;

    // Fallback por si el modelo escribe la llamada como texto en lugar de tool_call
    const functionRegex = /<function=(\w+)>(.*?)<\/function>/s;
    const match = text.match(functionRegex);

    if (!messageResponse.tool_calls && match) {
      messageResponse.tool_calls = [{
        id: "call_" + Date.now(),
        type: "function",
        function: { name: match[1], arguments: match[2].trim() }
      }];
    }

    if (messageResponse.tool_calls && messageResponse.tool_calls.length > 0) {
      if (match) text = text.replace(functionRegex, "").trim();

      const toolCall = messageResponse.tool_calls[0];
      const functionName = toolCall.function.name;
      let args: any = {};
      try { args = JSON.parse(toolCall.function.arguments || "{}"); } catch (e) { }

      let functionResult: any = null;
      let toolError = false;

      // Validación de seguridad: usuarios normales solo pueden llamar get_my_unit
      const allowedForUser = ["get_my_unit"];
      if (!isAdmin && !allowedForUser.includes(functionName)) {
        functionResult = "Acceso denegado. Solo puedes consultar información de tu propia unidad.";
        toolError = true;
      }

      if (!toolError) {
        try {
          switch (functionName) {
            case "get_my_unit":
              functionResult = await get_my_unit(userEmail);
              break;
            case "get_fleet_report":
              functionResult = await get_fleet_report(args.empresa_flota, args.estatus);
              break;
            case "get_pending_services":
              functionResult = await get_pending_services(args.query);
              break;
            case "get_fleet_status_summary":
              functionResult = await get_fleet_status_summary(args.empresa_flota);
              break;
            case "get_unit_details":
              functionResult = await get_unit_details(args.identificador || "");
              break;
            case "get_fleet_costs":
              functionResult = await get_fleet_costs(args.empresa);
              break;
            case "predict_upcoming_services":
              functionResult = await predict_upcoming_services();
              break;
            case "audit_checklist_compliance":
              functionResult = await audit_checklist_compliance();
              break;
            case "get_employee_directory":
              functionResult = await get_employee_directory({ departamento: args.departamento, cargo: args.cargo, nombre: args.nombre });
              break;
            case "get_employee_stats":
              functionResult = await get_employee_stats();
              break;
            case "get_computo_inventory":
              functionResult = await get_computo_inventory({ estatus: args.estatus, empresa: args.empresa });
              break;
            case "get_caja_chica_records":
              functionResult = await get_caja_chica_records(args.email, args.semana, args.anio);
              break;
          }
        } catch (err) {
          console.error("Tool execution error:", err);
          functionResult = "Error técnico de conexión.";
          toolError = true;
        }
      }

      if (!toolError) {
        const wantsFile = lastMessage.includes("factura") || lastMessage.includes("pdf") || lastMessage.includes("descarga");
        if (wantsFile) {
          const extractFile = (item: any) => {
            if (!item) return false;
            if (item.Ruta_PDF || item.Evidencia) {
              fileUrl = item.Ruta_PDF || item.Evidencia;
              fileName = item.Titulo || (item.Pk_folio_ticket ? `Ticket_${item.Pk_folio_ticket}` : "Documento");
              return true;
            }
            return false;
          };
          if (Array.isArray(functionResult)) functionResult.some(extractFile);
          else extractFile(functionResult);
        }
      }

      let aiResponseData = functionResult;
      const isArray = Array.isArray(functionResult);
      const userAskedForExcel = lastMessage.includes("excel") || lastMessage.includes("reporte");

      // Solo admins pueden generar Excel
      if (isAdmin && isArray && functionResult.length > 0 && userAskedForExcel) {
        excelBase64 = await generateExcelBase64(functionResult);
        aiResponseData = { info: "Excel generado.", muestra: functionResult.slice(0, 3), total: functionResult.length };
      } else if (isArray && functionResult.length > 15) {
        // Evitamos enviar una respuesta gigantesca a Groq para prevenir el error 413 (Payload Too Large)
        aiResponseData = {
          info: "Lista grande recibida. Se muestra una muestra reducida para el contexto del asistente.",
          muestra: functionResult.slice(0, 10),
          total: functionResult.length
        };
      }

      aiMessages.push(messageResponse);
      aiMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: functionName,
        content: typeof aiResponseData === "string" ? aiResponseData : JSON.stringify(aiResponseData)
      });

      const finalCompletion = await callGroq(aiMessages, undefined, 0.4);
      text = finalCompletion.choices[0].message.content || "He procesado los datos.";
    }

    return NextResponse.json({ text, excelBase64, fileUrl, fileName });

  } catch (error: any) {
    console.error("Final catch error:", error);
    return NextResponse.json({ text: "Lo siento, hubo un problema técnico. Por favor, intenta de nuevo." }, { status: 200 });
  }
}
