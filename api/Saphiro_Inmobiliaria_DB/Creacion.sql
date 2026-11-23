CREATE TABLE "estados" (
  "id" SERIAL PRIMARY KEY,
  "nombre" character varying(100) UNIQUE NOT NULL
);

CREATE TABLE "ciudades" (
  "id" SERIAL PRIMARY KEY,
  "estado_id" INTEGER NOT NULL,
  "nombre" character varying(100) NOT NULL
);

CREATE TABLE "usuarios" (
  "id" SERIAL PRIMARY KEY,
  "nombre" character varying(100),
  "email" character varying(150) NOT NULL,
  "password_hash" TEXT,
  "rol" character varying(20) CHECK (rol IN ('admin', 'corredor', 'cliente')),
  "fecha_registro" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "active" BOOLEAN DEFAULT true,
  "deleted_at" TIMESTAMP,
  "email_verified" BOOLEAN DEFAULT false
);

CREATE TABLE "corredores" (
  "id" SERIAL PRIMARY KEY,
  "usuario_id" INTEGER NOT NULL,
  "licencia_nro" character varying(50),
  "telefono" character varying(20),
  "comision_base" NUMERIC(5,2) DEFAULT 0
);

CREATE TABLE "tipos_inmueble" (
  "id" SERIAL PRIMARY KEY,
  "nombre" character varying(50) NOT NULL
);

CREATE TABLE "preferencias_clientes" (
  "id" SERIAL PRIMARY KEY,
  "usuario_id" INTEGER NOT NULL,
  "tipo_inmueble_id" INTEGER NOT NULL,
  "presupuesto_max" NUMERIC(15,2),
  "es_alquiler" BOOLEAN DEFAULT false,
  "ciudad_preferido_id" INTEGER
);

CREATE TABLE "inmuebles" (
  "id" SERIAL PRIMARY KEY,
  "titulo" character varying(200) NOT NULL,
  "descripcion" TEXT,
  "tipo_inmueble_id" INTEGER NOT NULL,
  "estado_inmueble" character varying(20) CHECK (estado_inmueble IN ('venta',
  'alquiler_fijo', 'vacacional')),
  "precio" NUMERIC(15,2) NOT NULL,
  "moneda" character varying(5) NOT NULL,
  "direccion_exacta" TEXT NOT NULL,
  "area_m2" NUMERIC(10,2),
  "ciudad_id" INTEGER NOT NULL,
  "corredor_id" INTEGER NOT NULL,
  "fecha_publicacion" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP),
  "promedio_estrellas" NUMERIC(3,2) DEFAULT 0,
  "punto_referencia" TEXT
);

CREATE TABLE "ubicaciones_gps" (
  "id" SERIAL PRIMARY KEY,
  "inmueble_id" INTEGER NOT NULL,
  "latitud" NUMERIC(10,8) NOT NULL,
  "longitud" NUMERIC(11,8) NOT NULL,
  "google_maps_url" TEXT NOT NULL
);

CREATE TABLE "transacciones" (
  "id" SERIAL PRIMARY KEY,
  "inmueble_id" INTEGER NOT NULL,
  "cliente_id" INTEGER NOT NULL,
  "tipo_operacion" character varying(20) CHECK (tipo_operacion IN ('compra',
'venta', 'alquiler')),
  "estatus_pago" character varying(20) CHECK (estatus_pago IN
('pendiente', 'pagado', 'cancelado')) DEFAULT 'pendiente',
  "monto_total" NUMERIC(15,2) NOT NULL,
  "moneda" character varying(5) NOT NULL,
  "fecha_transaccion" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "guardados" (
  "id" SERIAL PRIMARY KEY,
  "inmueble_id" integer NOT NULL,
  "usuario_id" integer NOT NULL
);

CREATE TABLE "comisiones" (
  "id" SERIAL PRIMARY KEY,
  "transaccion_id" INTEGER UNIQUE NOT NULL,
  "corredor_id" INTEGER NOT NULL,
  "monto_comision" NUMERIC(15,2) NOT NULL,
  "porcentaje_aplicado" NUMERIC(5,2) NOT NULL,
  "empresa_ganancia" NUMERIC(15,2) NOT NULL,
  "fecha_pago" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "bitacora_auditoria" (
  "id" SERIAL PRIMARY KEY,
  "usuario_id" INTEGER NOT NULL,
  "accion" character varying(100) NOT NULL,
  "tabla_afectada" character varying(50) NOT NULL,
  "descripcion" TEXT NOT NULL,
  "ip_address" character varying(45) NOT NULL,
  "user_agent" TEXT NOT NULL,
  "fecha_hora" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "imagenes" (
  "id" SERIAL PRIMARY KEY,
  "inmueble_id" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "orden" integer NOT NULL,
  "portada" bool NOT NULL,
  "directorio" TEXT NOT NULL
);

CREATE TABLE "resenas" (
  "id" SERIAL PRIMARY KEY,
  "inmueble_id" INTEGER NOT NULL,
  "usuario_id" integer NOT NULL,
  "estrellas" integer CHECK (estrellas >= 0 AND estrellas <=5),
  "comentario" TEXT NOT NULL,
  "fecha_publicacion" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "caracteristicas" (
  "id" SERIAL PRIMARY KEY,
  "nombre" character varying(50) NOT NULL,
  "unidad_medicion" character varying(25) 
);

CREATE TABLE "caracteristica_inmueble" (
  "id" SERIAL PRIMARY KEY,
  "caracteristica_id" integer NOT NULL,
  "inmueble_id" integer NOT NULL,
  "valor" TEXT NOT NULL
);

CREATE TABLE tasas_cambio (
  "id" SERIAL PRIMARY KEY,
  "bcv_dolar" DECIMAL(10, 2) NOT NULL,
  "bcv_euro" DECIMAL(10,2) NOT NULL,
  "fecha" date NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "alquiler_vacacional" (
  "id" SERIAL PRIMARY KEY,
  "inmueble_id" INTEGER UNIQUE NOT NULL,
  "precio_por_noche" NUMERIC(15,2) NOT NULL,
  "capacidad_personas" INTEGER NOT NULL,
  "noches_minimas" INTEGER DEFAULT 1,
  "hora_checkin" TIME,
  "hora_checkout" TIME
);

CREATE TABLE "reservas_vacacionales" (
  "id" SERIAL PRIMARY KEY,
  "alquiler_vacacional_id" INTEGER NOT NULL,
  "cliente_id" INTEGER NOT NULL,
  "transaccion_id" INTEGER UNIQUE,
  "fecha_entrada" DATE NOT NULL,
  "fecha_salida" DATE NOT NULL,
  "num_huespedes" INTEGER DEFAULT 1,
  "precio_total" NUMERIC(15,2) NOT NULL,
  "fecha_reserva" timestamp with time zone DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE "alquiler_vacacional_costos_adicionales" (
  "id" SERIAL PRIMARY KEY,
  "alquiler_vacacional_id" INTEGER NOT NULL,
  "costo_adicional_id" integer NOT NULL,
  "descripcion" TEXT,
  "monto" NUMERIC(15,2) NOT NULL
);

CREATE TABLE "costos_adicionales" (
  "id" SERIAL PRIMARY KEY,
  "nombre" character varying(100) NOT NULL
);

CREATE TABLE "notificaciones" (
  "id" SERIAL PRIMARY KEY,
  "usuario_id" INTEGER NOT NULL,
  "titulo" character varying(100) NOT NULL,
  "descripcion" TEXT NOT NULL,
  "tipo_notificacion" character varying(50) CHECK (tipo_notificacion IN ('Sistema', 'Inmueble', 'Transaccion', 'Comision', 'Corredor')),
  "fecha_hora" timestamp with time zone DEFAULT (CURRENT_TIMESTAMP),
  "leida" BOOLEAN NOT NULL DEFAULT FALSE
);


--Foreign Keys

ALTER TABLE "ciudades" ADD FOREIGN KEY ("estado_id") REFERENCES "estados" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "corredores" ADD FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "preferencias_clientes" ADD FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "preferencias_clientes" ADD FOREIGN KEY ("tipo_inmueble_id") REFERENCES "tipos_inmueble" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "preferencias_clientes" ADD FOREIGN KEY ("ciudad_preferido_id") REFERENCES "ciudades" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inmuebles" ADD FOREIGN KEY ("tipo_inmueble_id") REFERENCES "tipos_inmueble" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inmuebles" ADD FOREIGN KEY ("ciudad_id") REFERENCES "ciudades" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inmuebles" ADD FOREIGN KEY ("corredor_id") REFERENCES "corredores" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "ubicaciones_gps" ADD FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transacciones" ADD FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transacciones" ADD FOREIGN KEY ("cliente_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "comisiones" ADD FOREIGN KEY ("transaccion_id") REFERENCES "transacciones" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "comisiones" ADD FOREIGN KEY ("corredor_id") REFERENCES "corredores" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "bitacora_auditoria" ADD FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Guardados" ADD FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Guardados" ADD FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "imagenes" ADD FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "caracteristica_inmueble" ADD FOREIGN KEY ("caracteristica_id") REFERENCES "caracteristicas" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "caracteristica_inmueble" ADD FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "resenas" ADD FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "resenas" ADD FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "alquiler_vacacional" ADD FOREIGN KEY ("inmueble_id") REFERENCES "inmuebles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reservas_vacacionales" ADD FOREIGN KEY ("alquiler_vacacional_id") REFERENCES "alquiler_vacacional" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reservas_vacacionales" ADD FOREIGN KEY ("transaccion_id") REFERENCES "transacciones" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "reservas_vacacionales" ADD FOREIGN KEY ("cliente_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "alquiler_vacacional_costos_adicionales" ADD FOREIGN KEY ("alquiler_vacacional_id") REFERENCES "alquiler_vacacional" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "alquiler_vacacional_costos_adicionales" ADD FOREIGN KEY ("costo_adicional_id") REFERENCES "costos_adicionales" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "notificaciones" ADD FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") DEFERRABLE INITIALLY IMMEDIATE;


--Indices
CREATE INDEX idx_inmuebles_precio ON inmuebles(moneda, precio);

CREATE INDEX idx_inmuebles_tipo ON inmuebles(tipo_inmueble_id);

CREATE UNIQUE INDEX idx_usuarios_email ON usuarios (email) WHERE deleted_at IS NULL;

CREATE INDEX idx_bitacora_fecha ON bitacora_auditoria(fecha_hora);

CREATE INDEX idx_transacciones_inmueble_estado ON transacciones (inmueble_id, estatus_pago, tipo_operacion, fecha_transaccion DESC);

CREATE INDEX idx_reservas_vacacionales_fechas ON reservas_vacacionales (alquiler_vacacional_id, fecha_salida);