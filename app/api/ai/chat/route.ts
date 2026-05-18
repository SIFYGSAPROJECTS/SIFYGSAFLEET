import { NextResponse } from "next/server";
import { 
  get_inventory_summary, 
  get_unit_details, 
  get_fleet_stats, 
  get_unassigned_units, 
  get_dynamic_units, 
  get_recent_tickets,
  get_employee_directory,
  get_employee_stats,
  get_checklists,
  get_unit_tickets,
  get_unit_history,
  get_unit_assignment_history,
  get_ticket_details,
  get_pending_services,
  get_fleet_alerts,
  get_services_summary,
  get_fleet_status_summary,
  get_fleet_report,
  get_fleet_costs,
  predict_upcoming_services,
  audit_checklist_compliance
} from "@/lib/ai/ai-actions";
import { generateExcelBase64 } from "@/lib/ai/excel-generator";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const SYSTEM_PROMPT = `
Eres SIFY Asistente IA.

REGLA CRÍTICA PARA EXCEL:
1. Si el usuario pide un "reporte", "Excel" o "lista", DEBES usar herramientas que devuelvan listas de datos como 'get_fleet_report' o 'get_pending_services'.
2. NO uses herramientas de resumen (como 'get_fleet_status_summary') si te piden un Excel, ya que los resúmenes no se pueden convertir en tabla detallada.
3. El sistema generará el botón de descarga automáticamente si devuelves una lista de más de 1 elemento.

RESPUESTA A PREGUNTAS GENERALES DE CAPACIDADES ("¿En qué ayudas?", "¿Qué puedes hacer?"):
Si el usuario te pregunta en qué le puedes ayudar, qué puedes hacer o para qué sirves, responde de manera estructurada y amigable que puedes ayudar con:
1. **Inventario y Estado de Flota**: Consultar autos activos, inactivos y asignaciones de empleados.
2. **Rastreo de Tickets y Servicios**: Ver servicios pendientes, estado de tickets y mantenimientos recientes.
3. **Análisis de Costos**: Obtener reportes de gastos de mantenimiento de la flota o por empresa.
4. **Predicción de Servicios**: Analizar kilometraje para predecir qué vehículos necesitarán servicio pronto (ej. cercanos a 10k).
5. **Auditoría de Checklists**: Revisar qué vehículos activos no han entregado su checklist en el último mes.

IMPORTANTE: Recuerda recalcar que NO puedes alterar datos ni modificar tickets, solo eres una herramienta de consulta analítica y gerencial.

PERSONALIDAD:
- Breve, directo y profesional.
`;

const TOOLS = [
  { 
    type: "function", 
    function: {
      name: "get_fleet_report", 
      description: "Obtener LISTA DETALLADA para generar REPORTES EXCEL de unidades y conductores.",
      parameters: { 
        type: "object", 
        properties: { 
          empresa_flota: { type: "string", description: "Opcional. Prefijo de empresa (Ej. AVH). Usa 'Todas' si piden flota total o no especifican." },
          estatus: { type: "string", description: "Opcional. Filtro de estatus (Ej. 'Activo', 'Baja'). Usa 'Todos' por defecto." }
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
      description: "Ver conteos rápidos (Texto). NO sirve para Excel.",
      parameters: { 
        type: "object", 
        properties: { 
          empresa_flota: { type: "string", description: "Opcional. Prefijo de empresa (Ej. AVH). Usa 'Todas' si piden flota total o no especifican." }
        } 
      }
    }
  },
  { 
    type: "function", 
    function: {
      name: "get_unit_details", 
      description: "Ver datos de un auto específico.", 
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
      description: "Predice qué vehículos necesitarán mantenimiento pronto analizando su kilometraje (cercanos a múltiplos de 10,000 km).",
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
  }
];

async function callGroq(messages: any[], tools?: any[], temp = 0) {
  const body: any = {
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: temp,
    max_tokens: 1024
  };
  
  if (tools) {
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
  return response.json();
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    if (!GROQ_API_KEY) return NextResponse.json({ text: "Error: API Key no configurada." }, { status: 200 });

    let groqMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    const recentMessages = messages.slice(-5);
    for (const msg of recentMessages) {
      groqMessages.push({ role: msg.role === "model" ? "assistant" : "user", content: msg.content || "" });
    }

    const completion = await callGroq(groqMessages, TOOLS, 0);
    const messageResponse = completion.choices[0].message;
    
    let text = messageResponse.content || "";
    let excelBase64 = null;
    let fileUrl = null;
    let fileName = null;

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
      try { args = JSON.parse(toolCall.function.arguments || "{}"); } catch(e){}
      
      let functionResult: any = null;
      let toolError = false;
      
      try {
        switch (functionName) {
          case "get_fleet_report": functionResult = await get_fleet_report(args.empresa_flota, args.estatus); break;
          case "get_pending_services": functionResult = await get_pending_services(args.query); break;
          case "get_fleet_status_summary": functionResult = await get_fleet_status_summary(args.empresa_flota); break;
          case "get_unit_details": functionResult = await get_unit_details(args.identificador || ""); break;
          case "get_fleet_costs": functionResult = await get_fleet_costs(args.empresa); break;
          case "predict_upcoming_services": functionResult = await predict_upcoming_services(); break;
          case "audit_checklist_compliance": functionResult = await audit_checklist_compliance(); break;
        }
      } catch (err) {
        console.error("Tool execution error:", err);
        functionResult = "Error técnico de conexión.";
        toolError = true;
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

      // LOGICA DE GENERACION EXCEL
      if (isArray && functionResult.length > 0 && userAskedForExcel) {
        excelBase64 = await generateExcelBase64(functionResult);
        aiResponseData = { info: "Excel generado.", muestra: functionResult.slice(0, 3), total: functionResult.length };
      }

      groqMessages.push(messageResponse);
      groqMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: functionName,
        content: typeof aiResponseData === 'string' ? aiResponseData : JSON.stringify(aiResponseData)
      });

      const finalCompletion = await callGroq(groqMessages, undefined, 0.4);
      text = finalCompletion.choices[0].message.content || "He procesado los datos.";
    }

    return NextResponse.json({ text, excelBase64, fileUrl, fileName });

  } catch (error: any) {
    console.error("Final catch error:", error);
    return NextResponse.json({ text: "Lo siento, hubo un problema técnico. Por favor, intenta de nuevo." }, { status: 200 }); 
  }
}
