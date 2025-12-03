import { GoogleGenAI } from "@google/genai";
import { Message, ServiceRecord, Customer } from "../types";

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateSmartReply = async (
  messages: Message[], 
  customerName: string,
  plate: string | undefined,
  services?: ServiceRecord[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API Key no configurada.";
  }

  const conversationHistory = messages.map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n');
  const contextServices = services && services.length > 0 ? JSON.stringify(services) : "No se encontraron servicios activos para esta placa/nombre.";

  const prompt = `
    Actúa como "AutoBot", el asistente virtual de "404 Studio Xpress".
    
    Contexto:
    - Somos un centro de lavado y detailing automotriz.
    - Objetivo: Informar estado del auto y agendar servicios.
    
    Información del Cliente:
    Nombre: ${customerName}
    Placa Identificada: ${plate || "No detectada"}
    Historial de Servicios (JSON): ${contextServices}
    
    Historial de Chat:
    ${conversationHistory}
    
    Instrucciones:
    1. ESTADO DEL AUTO: Si preguntan "¿está listo?" o por su auto, revisa el JSON.
       - Si estado es "READY" o "LISTO", di que pueden pasar a recogerlo.
       - Si es "IN_PROCESS", pide paciencia.
       - Si es "WAITING", indica que pronto entrará a lavado.
    2. Si no hay servicio activo, ofrece precios (Lavado Básico S/25, Premium S/45).
    3. TONO: Amable, rápido y servicial.
    4. IMPORTANTE: Si el auto está listo, recuérdales que aceptamos Yape/Plin.
    5. Solo devuelve el texto de la respuesta.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Lo siento, no pude verificar el estado del vehículo.";
  } catch (error) {
    console.error("Error generating reply:", error);
    return "Error de conexión con el sistema CarWash.";
  }
};

export const generateDailyReport = async (
  metrics: any,
  services: ServiceRecord[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API Key missing.";
  }

  const prompt = `
    Genera un Reporte Operativo Diario para "404 Studio Xpress".
    
    Métricas del día:
    ${JSON.stringify(metrics, null, 2)}
    
    Servicios del día:
    ${JSON.stringify(services.slice(0, 10), null, 2)}
    
    Estructura del Reporte (Markdown):
    # 🚗 Reporte Diario - 404 Studio Xpress
    ## Resumen Ejecutivo
    (Breve análisis de flujo de autos y facturación)
    
    ## ⏱️ Eficiencia Operativa
    - Autos lavados hoy: [Dato]
    - Tiempo promedio: [Dato]
    - Cuellos de botella detectados (si hay muchos en espera)
    
    ## 💰 Finanzas
    - Ingresos estimados: [Dato]
    - Deudas pendientes: [Dato]
    
    ## 💡 Recomendaciones
    (Sugerencias para mejorar el flujo de lavado mañana)
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Error al generar el reporte diario.";
  }
};