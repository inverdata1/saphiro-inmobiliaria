export function looksLikePersonName(s) {
  const t = String(s || "").trim();
  if (t.length < 5 || t.length > 80 || /\d/.test(t)) return false;
  if (/^[A-ZÁÉÍÓÚÑÜ]{2,}(?:\s+[A-ZÁÉÍÓÚÑÜ]{2,}){1,5}$/.test(t)) return true;
  return /^(?:[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'’.-]{1,})(?:\s+(?:de|del|la|los|las|y)\s+|\s+)(?:[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'’.-]{1,})(?:\s+(?:de|del|la|los|las|y)\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'’.-]{1,}|\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü'’.-]{1,}){0,3}$/.test(t);
}

export function looksLikePii(s) {
  if (!s) return false;
  if (s.length > 280) return true;
  if (/@/.test(s)) return true;
  if (/\b[VEJPG]-?\d{5,}/i.test(s)) return true;
  if (/^\+?\d[\d\s().-]{6,}$/.test(s)) return true;
  if (/^[\d\s.,$€/%:+\-]+$/i.test(s)) return true;
  if (/^(PB|PH|Local)\s*-?\s*\d/i.test(s)) return true;
  if (/^\d{1,2}-\d{1,2}$/.test(s)) return true;
  if (looksLikePersonName(s)) return true;
  return false;
}

export function looksLikeMoney(s) {
  const t = String(s || "").trim();
  if (!/\d/.test(t)) return false;
  return t.replace(/[^A-Za-z]/g, "").length <= 3;
}

export function looksSpanish(s) {
  const raw = String(s || "").trim();
  const counted = raw.match(/^\d[\d.]*\s+(.+)$/);
  const t = counted ? counted[1].trim() : raw;
  if (/[áéíóúñü¿¡]/i.test(t)) return true;
  if (/\b(el|la|los|las|de|del|al|un|una|para|por|con|que|configuración|guardar|buscar|pendiente|disponible|comprometido|vigente|ejecutado|partida|partidas|monto|presupuesto|presupuestaria|solicitud|solicitudes|requisicion|requisición)\b/i.test(t)) return true;
  return /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü¿¡][A-Za-zÁÉÍÓÚÑÜáéíóúñü\s./()¿¡,%+\-–—]{1,180}$/.test(t);
}


export function foldKey(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const foldCache = new WeakMap();

export function glossaryHit(glossary, text) {
  if (!glossary || text == null) return undefined;
  if (glossary[text]) return glossary[text];
  let folded = foldCache.get(glossary);
  if (!folded) {
    folded = {};
    for (const es of Object.keys(glossary)) {
      const key = foldKey(es);
      if (folded[key] == null) folded[key] = glossary[es];
    }
    foldCache.set(glossary, folded);
  }
  return folded[foldKey(text)];
}

export function shouldMachineTranslate(text, glossary) {
  const trim = String(text || "").trim();
  return Boolean(trim) && !glossaryHit(glossary, trim) && !applyGlossaryText(glossary, trim) && !looksLikePii(trim) && looksSpanish(trim);
}

const targetCache = new WeakMap();
function isGlossaryTarget(glossary, text) {
  let targets = targetCache.get(glossary);
  if (!targets) {
    targets = {};
    for (const en of Object.values(glossary || {})) targets[foldKey(en)] = true;
    targetCache.set(glossary, targets);
  }
  return Boolean(targets[foldKey(text)]);
}

const WORD_EN = {
  de: "of", del: "of the", la: "the", las: "the", los: "the", el: "the",
  y: "and", al: "to the", en: "in", por: "by", para: "for", con: "with",
  sin: "without", un: "a", una: "a", su: "its", sus: "their",
  bono: "bonus", compensatorio: "compensatory", transporte: "transport",
  personal: "personnel", alto: "high", nivel: "level", direccion: "directorate",
  bonificacion: "bonus", empleado: "employee", empleados: "employees",
  paquete: "package", paquetes: "packages", programa: "program", programas: "programs",
  computacion: "computing", transferencia: "transfer", transferencias: "transfers",
  capital: "capital", ente: "entity", entes: "entities",
  descentralizado: "decentralized", descentralizados: "decentralized",
  fin: "purpose", fines: "purposes", empresarial: "corporate", empresariales: "corporate",
  monto: "amount", inicial: "initial", modificacion: "amendment", modificaciones: "amendments",
  vigente: "current", comprometido: "committed", comprometida: "committed",
  ejecutado: "executed", ejecutada: "executed", ejecucion: "execution",
  partida: "line", partidas: "lines", presupuestaria: "budget", presupuestario: "budget",
  presupuesto: "budget", codigo: "code", disponible: "available", disponibilidad: "availability",
  apartamento: "apartment", apartamentos: "apartments", vacacional: "vacation",
  vista: "view", vistas: "views", venta: "sale", ventas: "sales",
  casa: "house", casas: "houses", quinta: "estate", quintas: "estates",
  nivel: "level", niveles: "levels", habitacion: "bedroom", habitaciones: "bedrooms",
  bano: "bathroom", banos: "bathrooms", playa: "beach", mar: "sea",
  alquiler: "rent", terreno: "land", edificio: "building", residencia: "residence",
  lujo: "luxury", amueblado: "furnished", amueblada: "furnished", piscina: "pool",
  jardin: "garden", gladiola: "gladiolus", local: "shop",
  general: "overall", anual: "annual", detalle: "detail", detalles: "details",
  catalogo: "catalog", catalogos: "catalogs", decreto: "decree", decretos: "decrees",
  ordinal: "ordinal", ordinales: "ordinals", orden: "order", ordenes: "orders",
  pago: "payment", pagos: "payments", obra: "work", obras: "works",
  publica: "public", publicas: "public", caja: "cash", bien: "asset", bienes: "assets",
  reporte: "report", reportes: "reports", cierre: "closing", cierres: "closings",
  conciliacion: "reconciliation", bancaria: "bank", bancario: "bank",
  tesoreria: "treasury", finanzas: "finance", logistica: "logistics",
  configuracion: "settings", gestion: "management", administracion: "administration",
  proveedor: "vendor", proveedores: "vendors", requisicion: "requisition",
  requisiciones: "requisitions", compra: "purchase", compras: "purchases",
  servicio: "service", servicios: "services", factura: "invoice", facturas: "invoices",
  cuenta: "account", cuentas: "accounts", banco: "bank", bancos: "banks",
  usuario: "user", usuarios: "users", clave: "password", inicio: "home",
  buscar: "search", guardar: "save", nuevo: "new", nueva: "new",
  editar: "edit", eliminar: "delete", total: "total", fecha: "date",
  estado: "status", nombre: "name", descripcion: "description",
  observaciones: "notes", acciones: "actions", pendiente: "pending",
  pendientes: "pending", aprobado: "approved", aprobada: "approved",
  anulado: "voided", anulada: "voided", rechazado: "rejected",
  pagado: "paid", pagada: "paid", activo: "active", activa: "active",
  inactivo: "inactive", ingreso: "income", ingresos: "revenue",
  gasto: "expense", gastos: "expenses", deuda: "debt", deudas: "debts",
  fondo: "fund", fondos: "funds", trimestre: "quarter", semestre: "half-year",
  acumulado: "year to date", millones: "millions", neto: "net",
  causado: "accrued", causada: "accrued", control: "control",
  linea: "line", lineas: "lines", unidad: "unit", unidades: "units",
  sector: "sector", actividad: "activity", fuente: "source", fuentes: "sources",
  nomina: "payroll", nominas: "payrolls", trabajador: "employee", trabajadores: "employees",
  inmueble: "property", inmuebles: "properties", propietario: "owner", propietarios: "owners",
  condominio: "condominium", torre: "tower", torres: "towers",
  recibo: "receipt", recibos: "receipts", solvencia: "solvency",
  impuesto: "tax", impuestos: "taxes", tasa: "rate", tasas: "rates",
  retencion: "withholding", retenciones: "withholdings", concepto: "concept",
  numero: "number", desde: "from", hasta: "to", tipo: "type",
  solicitud: "request", solicitudes: "requests", compromiso: "commitment",
  compromisos: "commitments", credito: "credit", creditos: "credits",
  disminucion: "decrease", traslado: "transfer", sueldo: "salary", sueldos: "salaries",
  ejercicio: "fiscal year", fiscal: "fiscal", alcaldia: "city hall",
};

function matchCase(source, translated) {
  if (!translated) return translated;
  if (source === source.toUpperCase()) return translated.toUpperCase();
  if (source === source.toLowerCase()) return translated.toLowerCase();
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

/** Official budget-line titles. Exact phrase, not word-by-word. */
const PHRASES = {
  "impuesto al valor agregado": "Value added tax",
  "aguinaldos a empleados": "Year-end bonus for employees",
  "aguinaldos al personal de alto nivel y de direccion": "Year-end bonus for senior and management personnel",
  "aporte para la adquisicion de juguetes para hijos del personaempleado": "Contribution to buy toys for employees' children",
  "aportes para la adquisicion de juguetes para los hijos e hijas del personal de alto nivel y de direccion": "Contribution to buy toys for the children of senior and management personnel",
  "bono compensatorio de alimentacion a empleados": "Compensatory food bonus for employees",
  "bono compensatorio de alimentacion al personal de alto nivel y de direccion": "Compensatory food bonus for senior and management personnel",
  "bono vacacional a empleados": "Vacation bonus for employees",
  "bono vacacional al personal de alto nivel y de direccion": "Vacation bonus for senior and management personnel",
  "commplemento a empleados por horas extraordinarias o por sobre tiempo": "Overtime pay supplement for employees",
  "compensaciones previstas en las escalas de sueldo al personal empleado fijo a tiempo completo": "Salary-scale compensation for full-time permanent employees",
  "compensaciones previstas en las escalas de sueldos del personal de alto nivel y de direccion": "Salary-scale compensation for senior and management personnel",
  "complemento a empleados por dias feriados": "Holiday pay supplement for employees",
  "complemento a empleados por trabajo nocturno": "Night-shift pay supplement for employees",
  "otras primas a empleados": "Other bonuses for employees",
  "otras primas al personal de alto nivel y de direccion": "Other bonuses for senior and management personnel",
  "otros complementos a empleados": "Other pay supplements for employees",
  "otros complementos el personal de alto nivel y de direccion": "Other pay supplements for senior and management personnel",
  "prestaciones sociales e indemnizaciones a empleados": "Social benefits and severance for employees",
  "prestaciones sociales e indemnizaciones al personal de alto nivel y de direccion": "Social benefits and severance for senior and management personnel",
  "prima de profesionalizacion a empleados": "Professionalization bonus for employees",
  "prima por antiguedad a empleados": "Seniority bonus for employees",
  "primas por hijos a empleados": "Child allowance for employees",
  "primas de antiguedad al personal de alto nivel y de direccion": "Seniority bonus for senior and management personnel",
  "primas de profesionalizacion al personal de alto nivel y de direccion": "Professionalization bonus for senior and management personnel",
  "primas por hijos e hijas al personal de alto nivel y de direccion": "Child allowance for senior and management personnel",
  "sueldo basico del personal de alto nivel y de direccion": "Basic salary of senior and management personnel",
  "sueldos basicos personal fijo tiempo completo": "Basic salaries of full-time permanent staff",
  "equipos de computacion": "Computer equipment",
  "mobiliario y equipos de oficina": "Office furniture and equipment",
  "mobiliario y equipo de alojamiento": "Lodging furniture and equipment",
  "transferencia corrientes a entes descentralizados sin fines empresariales": "Current transfers to decentralized non-business entities",
  "transferencias de capital a entes descentralizados sin fines empresariales": "Capital transfers to decentralized non-business entities",
  "equipos de telecomunicaciones": "Telecommunications equipment",
  "aguinaldos a obreros": "Year-end bonus for laborers",
  "aporte para la adquisicion de juguetes para los hijos del personal obrero": "Contribution to buy toys for laborers' children",
  "bono compensatorio de alimentacion a obreros": "Compensatory food bonus for laborers",
  "bono vacacional a obreros": "Vacation bonus for laborers",
  "compensaciones previstas en las escalas de sueldo al personal obrero fijo a tiempo completo": "Salary-scale compensation for full-time permanent laborers",
  "complemento a obreros por dias feriados": "Holiday pay supplement for laborers",
  "complemento a obreros por horas extraordinarias o por sobre tiempo": "Overtime pay supplement for laborers",
  "complemento a obreros por trabajo o jornada nocturna": "Night-shift pay supplement for laborers",
  "otras primas a obreros": "Other bonuses for laborers",
  "otros complementos a obreros": "Other pay supplements for laborers",
  "prestaciones sociales e indemnizaciones a obreros": "Social benefits and severance for laborers",
  "primas de profesionalizacion a obreros": "Professionalization bonus for laborers",
  "primas por antiguedad a obreros": "Seniority bonus for laborers",
  "primas por hijos a obreros": "Child allowance for laborers",
  "salarios a obreros en puestos permanentes a tiempo completo": "Wages for laborers in full-time permanent posts",
  "maquinarias y equipos de artes graficas y reproduccion": "Graphic-arts and reproduction machinery and equipment",
  "materiales electricos": "Electrical materials",
  "alimentos y bebidas para personas": "Food and beverages for people",
  "conservacion y reparaciones menores de maquinas, muebles y demas equipo de oficina y olojamiento": "Minor upkeep and repairs of office and lodging machines, furniture and equipment",
  "imprenta y produccion": "Printing and production",
  "otras maquinas, muebles y demas equipos de oficina y alojamiento": "Other office and lodging machines, furniture and equipment",
  "otros servicios no personales": "Other non-personal services",
  "alquileres de equipos de transporte, traccion y elevacion": "Rent of transport, traction and lifting equipment",
  "combustibles y lubricantes": "Fuels and lubricants",
  "conservaciones, ampliaciones. y mejoras mayores de obras y bienes del dominio publico": "Major upkeep, extensions and improvements of public-domain works and assets",
  "donaciones corrientes a personas": "Current donations to individuals",
  "materiales para equipos de computacion": "Materials for computer equipment",
  "materiales y utiles de limpieza y aseo": "Cleaning supplies",
  "productos de papel y carton para oficina": "Office paper and cardboard products",
  "productos de seguridad en el trabajo": "Workplace safety products",
  "reparaciones, mejoras y adiciones mayores de equipos de transporte traccion y elevacion": "Major repairs, improvements and additions to transport, traction and lifting equipment",
  "repuestos y accesorios para equipos de transporte": "Spare parts and accessories for transport equipment",
  "tintas, pituras y colorantes": "Inks, paints and dyes",
  "utiles de escritorio, oficina y materiales de instruccion": "Desk and office supplies and instructional materials",
  "vehiculos automotores terrestres": "Land motor vehicles",
  "abonos, plaguisidas y otros": "Fertilizers, pesticides and other products",
  "aguinaldos a altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Year-end bonus for senior officials and popularly elected officers",
  "alquileres de edificios y locales": "Rent of buildings and premises",
  "avisos": "Notices",
  "aportes para la adquisicion de juguetes para los hijos e hijas de los altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Contribution to buy toys for the children of senior officials and popularly elected officers",
  "bono compensatorio de alimentacion a altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Compensatory food bonus for senior officials and popularly elected officers",
  "bono vacacional a altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Vacation bonus for senior officials and popularly elected officers",
  "cauchos y tripas para vehiculos": "Tires and inner tubes for vehicles",
  "cemento, cal y yeso": "Cement, lime and plaster",
  "conservacion y repaciones menores de obras en bienes del dominio privado": "Minor upkeep and repairs of works on private-domain assets",
  "conservacion y reparaciones menores de equipos de transporte, traccion y elevacion": "Minor upkeep and repairs of transport, traction and lifting equipment",
  "construcciones de acueductos": "Aqueduct construction",
  "dotacion de uniformes a empleados": "Uniform allowance for employees",
  "dotacion de uniformes a obreros": "Uniform allowance for laborers",
  "equipos de ensenanza, deporte y recreacion": "Teaching, sports and recreation equipment",
  "herramientas menores, cuchillerias y articulos generales de ferreteria": "Small tools, cutlery and general hardware",
  "maquinarias y equipos de construccion y mantenimiento": "Construction and maintenance machinery and equipment",
  "onservacion y reparaciones menores de maquinarias y demas equipos de construccion, campo, industria y taller": "Minor upkeep and repairs of construction, field, industrial and workshop machinery and equipment",
  "otras maquinarias y demas equipos de contruccion, campo, industria y taller": "Other construction, field, industrial and workshop machinery and equipment",
  "otras primas a los altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Other bonuses for senior officials and popularly elected officers",
  "otros materiales y suministros": "Other materials and supplies",
  "otros productos metalicos": "Other metal products",
  "otros productos y utiles diversos": "Other miscellaneous products and supplies",
  "otros servicios profesionales y tecnicos": "Other professional and technical services",
  "otros complementos a altos funcionarios y altas funcionarias del sector publico y de eleccion popular": "Other pay supplements for senior public-sector and popularly elected officers",
  "piedra, arcilla,, arena y tierra": "Stone, clay, sand and earth",
  "prendas de vestir": "Clothing",
  "prestaciones sociales e indemnizaciones a altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Social benefits and severance for senior officials and popularly elected officers",
  "productos agricolas y pecuarios": "Agricultural and livestock products",
  "productos de arcilla para construccion": "Clay construction products",
  "productos de tocador": "Toiletries",
  "productos farmaceuticos y medicamentos": "Pharmaceuticals and medicines",
  "productos plasticos": "Plastic products",
  "primas de profesionalizacion de los altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Professionalization bonus for senior officials and popularly elected officers",
  "primas por antiguedad de los altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Seniority bonus for senior officials and popularly elected officers",
  "primas por hijos e hijas de los altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Child allowance for senior officials and popularly elected officers",
  "reparaciones mayores para maquinaria, muebles y demas equipos de oficina y alojamiento": "Major repairs of office and lodging machinery, furniture and equipment",
  "repuestos y accesorios para otros equipos": "Spare parts and accessories for other equipment",
  "servicios de diversion, esparcimiento y culturales": "Entertainment, recreation and cultural services",
  "sueldo basico de los altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Basic salary of senior officials and popularly elected officers",
  "textiles": "Textiles",
  "viaticos y pasajes dentro del pais": "Domestic travel allowances and fares",
  "agua": "Water",
  "aguinaldos al personal empleado, obrero y militar jubilado": "Year-end bonus for retired employees, laborers and military personnel",
  "aguinaldos del personal jubilado de alto nivel y direccion": "Year-end bonus for retired senior and management personnel",
  "alquileres de maquinarias y demas equipos de construccion, campo, industria y taller": "Rent of construction, field, industrial and workshop machinery and equipment",
  "alquileres de otras maquinarias y equipos": "Rent of other machinery and equipment",
  "aporte patronal al fondo de ahorro habitacional por altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Employer contribution to the housing savings fund for senior officials and popularly elected officers",
  "aporte patronal al fondo de ahorro habitacional por empleados": "Employer contribution to the housing savings fund for employees",
  "aporte patronal al fondo de ahorro habitacional por obreros": "Employer contribution to the housing savings fund for laborers",
  "aporte patronal al fondo de jubilaciones por altos funcionarios y altas funcionarias del poder publico y de eleccion popular": "Employer contribution to the retirement fund for senior officials and popularly elected officers",
  "aporte patronal al fondo de jubilaciones por empleados": "Employer contribution to the retirement fund for employees",
  "aporte patronal al fondo de jubilaciones por obreros": "Employer contribution to the retirement fund for laborers",
  "aporte patronal al fondo de jubilacion por personal de alto nivel y de direccion": "Employer contribution to the retirement fund for senior and management personnel",
  "aporte patronal al fondo de seguro de paro forzoso por empleados": "Employer contribution to the unemployment insurance fund for employees",
  "aporte patronal al fondo de seguro de paro forzoso por obreros": "Employer contribution to the unemployment insurance fund for laborers",
  "aporte patronal al fondo se seuro paro forzoso por personal de alto nivel y direcion": "Employer contribution to the unemployment insurance fund for senior and management personnel",
  "aporte patronal al instituto de los seguros sociales ( ivss) por obreros": "Employer contribution to the Social Security Institute (IVSS) for laborers",
  "aporte patronal al instituto de los seguros sociales (ivss) por empleados": "Employer contribution to the Social Security Institute (IVSS) for employees",
  "aporte patronal al instituto venezolano de los seguros sociales (ivss) por altos funcionarios y altas funcionarias del poder publico y de eleccion pop": "Employer contribution to the Venezuelan Social Security Institute (IVSS) for senior officials and popularly elected officers",
  "aporte patronal al instituto venezolano de los seguros sociales (ivss) por personal de alto nivel y de direccion": "Employer contribution to the Venezuelan Social Security Institute (IVSS) for senior and management personnel",
  "aporte patronal al personal de ahorro habitacional por personal de alto nivel y de direccion": "Employer housing-savings contribution for senior and management personnel",
  "articulos de deporte recreacion y juguetes": "Sports, recreation and toy articles",
  "ayudas para medicinas, gastos medicos, odontologicos y de hospitalizacion a empleados": "Aid for medicines and medical, dental and hospital expenses for employees",
  "aporte patronal al fondo contributivo del regimen prestacional de empleo por altos funcionarios y altas funcionarias del poder publico y de eleccion p": "Employer contribution to the employment-benefit fund for senior officials and popularly elected officers",
  "bonificacion a empleados": "Employee bonus",
  "bono compensatorio de transporte al personal de alto nivel y de direccion": "Compensatory transportation bonus for senior and management personnel",
  "bono compensatorio de transporte al personal": "Compensatory transportation bonus for personnel",
  "calzados": "Footwear",
  "comisiones y gastos bancarios": "Bank commissions and charges",
  "comisiones y gastos de adquisicion de seguros": "Insurance acquisition commissions and expenses",
  "condecoraciones, ofrendas y similares": "Decorations, offerings and similar items",
  "conservacion y reparacion menores de equipos de comunicaciones y de senalamiento": "Minor upkeep and repairs of communications and signaling equipment",
  "conservacion y reparaciones menores de obras en bienes del dominio publico": "Minor upkeep and repairs of works on public-domain assets",
  "conservacion y reparaciones menores de otras maquinarias y equipos": "Minor upkeep and repairs of other machinery and equipment",
  "construccion de vialidad": "Road construction",
  "contratacion de inspeccion de obras de bienes del dominio privado": "Inspection contracts for works on private-domain assets",
  "contratacion de inspeccion de obras de bienes del dominio publico": "Inspection contracts for works on public-domain assets",
  "dietas": "Attendance fees",
  "disminucion de cuentas por pagar a proveedores a corto plazo": "Decrease in short-term accounts payable to vendors",
  "disminucion de sueldos salarios y otras remuneraciones por pagar": "Decrease in salaries, wages and other compensation payable",
  "disminuciones de aporte patronal y retenciones laborales por pagar al fondo de ahorro habitacional": "Decrease in employer contributions and payroll withholdings payable to the housing savings fund",
  "disminuciones de aporte patronal y retenciones laborales por pagar al fondo de jubuilaciones": "Decrease in employer contributions and payroll withholdings payable to the retirement fund",
  "donaciones corrientes a instituciones sin fines de lucro": "Current donations to nonprofit institutions",
  "donaciones corrientes de organismos del sector publico a consejos com": "Current donations from public-sector agencies to communal councils",
  "edificaciones educativas": "Educational buildings",
  "electricidad": "Electricity",
  "envases y cajas, papel y carton": "Containers and boxes, paper and cardboard",
  "equipos de transporte, traccion y elevacion": "Transport, traction and lifting equipment",
  "fletes y embalajes": "Freight and packing",
  "instrumentos musicales": "Musical instruments",
  "jubilaciones del personal de alto nivel y de direccion": "Pensions for senior and management personnel",
  "jubilaciones del personal empleado, obrero y militar": "Pensions for employees, laborers and military personnel",
  "libros, revistas y periodicos": "Books, magazines and newspapers",
  "maquinarias y equipos de energia": "Energy machinery and equipment",
  "maquinarias y equipos de riego y acueductos": "Irrigation and aqueduct machinery and equipment",
  "maquinarias y equipos industriales y de taller": "Industrial and workshop machinery and equipment",
  "maquinarias y equipos para mantenimiento de automotores": "Motor-vehicle maintenance machinery and equipment",
  "material de senalamiento": "Signaling material",
  "materiales para instalaciones sanitarias": "Materials for sanitary installations",
  "mezclas explosivas": "Explosive mixtures",
  "muebles y accesorios de madera para edificaciones": "Wooden furniture and fittings for buildings",
  "otras maquinarias y equipos usados": "Other used machinery and equipment",
  "otras subvenciones a empleados": "Other subsidies for employees",
  "otros equipos de transporte , traccion y elevacion": "Other transport, traction and lifting equipment",
  "otros productos de pulpa, papel y carton": "Other pulp, paper and cardboard products",
  "otros productos textiles y vestuarios": "Other textile and clothing products",
  "paquetes y programas de computacion": "Software packages and programs",
  "petroleo, crudo y gas natural": "Petroleum, crude oil and natural gas",
  "producto de papel y carton par imprenta y reproduccion": "Paper and cardboard products for printing and reproduction",
  "productos de barro, loza y porcelana": "Clay, earthenware and porcelain products",
  "productos de metales no ferrosos": "Non-ferrous metal products",
  "productos metalicos estructurales": "Structural metal products",
  "productos primarios de hierro y acero": "Primary iron and steel products",
  "productos primarios de madera": "Primary wood products",
  "proyectos y estudios aplicables a bienes del dominio privado": "Projects and studies for private-domain assets",
  "proyectos y estudios aplicables a bienes del dominio publico": "Projects and studies for public-domain assets",
  "publicidad y propaganda": "Advertising and publicity",
  "pulpa de madera papel y carton": "Wood pulp, paper and cardboard",
  "rectificaciones al presupuesto": "Budget adjustments",
  "relaciones sociales": "Social relations",
  "reparaciones mayores de otras maquinarias y equipos": "Major repairs of other machinery and equipment",
  "repuestos mayores de otras maquinarias y equipos": "Major spare parts for other machinery and equipment",
  "repuestos mayores para equipos de transporte, traccion y elevacion": "Major spare parts for transport, traction and lifting equipment",
  "repuestos mayores para maquinarias y demas equipos de construccion, campo, industria y taller": "Major spare parts for construction, field, industrial and workshop machinery and equipment",
  "remuneraciones al personal contratado a tiempo determinado": "Compensation for fixed-term contract personnel",
  "remuneraciones por honorarios profesionales": "Professional-fee compensation",
  "servicio de capacitacion y adiestramiento": "Training services",
  "servicio de procesamiento de datos": "Data-processing services",
  "servicios de comunicaciones": "Communications services",
  "servicios de construcciones temporales": "Temporary-construction services",
  "servicios de ingenieria y arquitectonico": "Engineering and architectural services",
  "servicios juridicos": "Legal services",
  "subsidios a entidades religiosas": "Subsidies to religious entities",
  "subsidios a organismos laborales y gremiales": "Subsidies to labor and trade organizations",
  "utiles menores medicos- quirurgicos de laboratio, dentales y de veterinaria": "Minor medical, surgical, laboratory, dental and veterinary supplies",
  "vehiculos de traccion no motorizados": "Non-motorized traction vehicles",
  "vidrios y productos de vidrios": "Glass and glass products",
  "equipo de computacion": "Computer equipment",
};

function phraseKey(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function budgetPhrase(text) {
  return PHRASES[phraseKey(text)] || null;
}

function wordEnglish(glossary, word) {
  return WORD_EN[word.toLowerCase()] || WORD_EN[foldKey(word)];
}

function translateWords(glossary, trim) {
  if (looksLikePii(trim) || looksLikeMoney(trim)) return null;
  const words = trim.match(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{4,}/g) || [];
  if (!words.length) return null;
  let longHits = 0;
  const next = trim.replace(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/g, (word) => {
    if (word.length < 2 && foldKey(word) !== "y") return word;
    const hit = wordEnglish(glossary, word);
    if (!hit) return word;
    if (word.length >= 4) longHits += 1;
    return matchCase(word, hit);
  });
  if (!longHits || longHits !== words.length) return null;
  return next === trim ? null : next;
}

const reverseCache = new WeakMap();

function reverseFull(glossary, text) {
  const trim = String(text || "").trim();
  if (!trim) return undefined;
  let rev = reverseCache.get(glossary);
  if (!rev) {
    rev = {};
    const absorb = (es, en) => {
      const key = foldKey(en);
      if (key && rev[key] == null) rev[key] = es;
    };
    for (const [es, en] of Object.entries(glossary || {})) absorb(es, en);
    for (const [es, en] of Object.entries(WORD_EN)) absorb(es, en);
    reverseCache.set(glossary, rev);
  }
  return rev[foldKey(trim)];
}

export function rememberedSpanish(glossary, raw, stored) {
  const text = String(raw ?? "");
  const trim = text.trim();
  if (!trim) return stored || text;
  if (stored) {
    const glossed = applyGlossaryText(glossary, stored);
    if (glossed && foldKey(glossed.trim()) === foldKey(trim)) return stored;
    const storedRev = reverseFull(glossary, stored);
    if (storedRev) return storedRev;
    if (!reverseFull(glossary, trim)) return stored;
  }
  const rev = reverseFull(glossary, trim);
  if (rev) {
    const at = text.indexOf(trim);
    return text.slice(0, at) + rev + text.slice(at + trim.length);
  }
  return stored || text;
}

export function applyGlossaryText(glossary, raw) {
  const text = String(raw ?? "");
  const trim = text.trim();
  if (!trim) return null;
  const at = text.indexOf(trim);
  const lead = text.slice(0, at);
  const tail = text.slice(at + trim.length);
  const direct = glossaryHit(glossary, trim);
  if (direct) return lead + direct + tail;
  let match = trim.match(/^(.*?)\s+(\d{4})$/);
  if (match) {
    const phrase = glossaryHit(glossary, match[1].trim());
    if (phrase) return lead + phrase + " " + match[2] + tail;
  }
  match = trim.match(/^(\d[\d.]*)\s+(.+)$/);
  if (match) {
    const phrase = glossaryHit(glossary, match[2].trim());
    if (phrase) return lead + match[1] + " " + phrase + tail;
  }
  match = trim.match(/^([^:\d]{2,48}):\s+(\S.*)$/);
  if (match) {
    const phrase = glossaryHit(glossary, match[1].trim());
    const value = match[2];
    const spanishRest = /[áéíóúñü]/i.test(value) || /\b(de|del|para|por|con|que|las|los|una|este|esta|como|sin|luego|mismo|puede|primero|debe|tiene)\b/i.test(value);
    if (phrase && (looksLikePii(value) || looksLikeMoney(value) || !spanishRest)) return lead + phrase + ": " + value + tail;
  }
  const budget = budgetPhrase(trim);

  if (budget) return lead + matchCase(trim, budget) + tail;

  const worded = translateWords(glossary, trim);
  return worded ? lead + worded + tail : null;
}
