-- CreateTable
CREATE TABLE "Empleados" (
    "Email" VARCHAR(50) NOT NULL,
    "Nombre_Empleado" VARCHAR(30) NOT NULL,
    "A_Paterno" VARCHAR(30) NOT NULL,
    "A_Materno" VARCHAR(30),
    "Cargo" VARCHAR(30),
    "Departamento" VARCHAR(40),

    CONSTRAINT "Empleados_pkey" PRIMARY KEY ("Email")
);

-- CreateTable
CREATE TABLE "Inventario_Automoviles" (
    "Consecutivo" VARCHAR(10) NOT NULL,
    "Placa" VARCHAR(10) NOT NULL,
    "Marca" VARCHAR(20),
    "Modelo" VARCHAR(20),
    "Color" VARCHAR(15),
    "Linea" VARCHAR(15),
    "Estado_Unidad" BOOLEAN NOT NULL DEFAULT true,
    "Email_encargado" VARCHAR(50),

    CONSTRAINT "Inventario_Automoviles_pkey" PRIMARY KEY ("Consecutivo")
);

-- CreateTable
CREATE TABLE "Telefono" (
    "Email_Empleado" VARCHAR(50) NOT NULL,
    "No_Telefonico" VARCHAR(15) NOT NULL,

    CONSTRAINT "Telefono_pkey" PRIMARY KEY ("Email_Empleado","No_Telefonico")
);

-- CreateTable
CREATE TABLE "Historial_Registro_Automovil" (
    "Id_Historial_Reg" SERIAL NOT NULL,
    "Consecutivo" VARCHAR(10) NOT NULL,
    "Placa" VARCHAR(10),
    "Marca" VARCHAR(20),
    "Modelo" VARCHAR(20),
    "Color" VARCHAR(15),
    "Linea" VARCHAR(15),
    "Email_Personal" VARCHAR(50),
    "Fecha_Cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historial_Registro_Automovil_pkey" PRIMARY KEY ("Id_Historial_Reg")
);

-- CreateTable
CREATE TABLE "Historial_Auto" (
    "Id_Historial" SERIAL NOT NULL,
    "Consecutivo" VARCHAR(10) NOT NULL,
    "Placa_Actual" VARCHAR(10),
    "Kilometraje" INTEGER,
    "Estado_Actual" BOOLEAN NOT NULL DEFAULT true,
    "Descripcion" TEXT,
    "Fecha_Registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historial_Auto_pkey" PRIMARY KEY ("Id_Historial")
);

-- CreateTable
CREATE TABLE "Historial_Empleados" (
    "Id_Historial_Emp" SERIAL NOT NULL,
    "Email_Empleado" VARCHAR(50) NOT NULL,
    "Nombre" VARCHAR(30),
    "A_Paterno" VARCHAR(30),
    "A_Materno" VARCHAR(30),
    "Cargo" VARCHAR(30),
    "Departamento" VARCHAR(40),
    "Fecha_Cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Historial_Empleados_pkey" PRIMARY KEY ("Id_Historial_Emp")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "Pk_folio_ticket" VARCHAR(25) NOT NULL,
    "Consecutivo" VARCHAR(10) NOT NULL,
    "Email_Empleado" VARCHAR(50) NOT NULL,
    "Kilometraje" INTEGER,
    "Descripcion" TEXT,
    "Fecha_Realizacion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("Pk_folio_ticket")
);

-- CreateTable
CREATE TABLE "Procesos" (
    "Id_Proceso" SERIAL NOT NULL,
    "Pk_folio_ticket" VARCHAR(25) NOT NULL,
    "Email_Empleado" VARCHAR(50) NOT NULL,
    "Detalle_Proceso" TEXT,
    "Fecha_Hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Procesos_pkey" PRIMARY KEY ("Id_Proceso")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_Automoviles_Placa_key" ON "Inventario_Automoviles"("Placa");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_Email_Empleado_Fecha_Realizacion_key" ON "Solicitud"("Email_Empleado", "Fecha_Realizacion");

-- AddForeignKey
ALTER TABLE "Inventario_Automoviles" ADD CONSTRAINT "Inventario_Automoviles_Email_encargado_fkey" FOREIGN KEY ("Email_encargado") REFERENCES "Empleados"("Email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telefono" ADD CONSTRAINT "Telefono_Email_Empleado_fkey" FOREIGN KEY ("Email_Empleado") REFERENCES "Empleados"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Registro_Automovil" ADD CONSTRAINT "Historial_Registro_Automovil_Consecutivo_fkey" FOREIGN KEY ("Consecutivo") REFERENCES "Inventario_Automoviles"("Consecutivo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Registro_Automovil" ADD CONSTRAINT "Historial_Registro_Automovil_Email_Personal_fkey" FOREIGN KEY ("Email_Personal") REFERENCES "Empleados"("Email") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Auto" ADD CONSTRAINT "Historial_Auto_Consecutivo_fkey" FOREIGN KEY ("Consecutivo") REFERENCES "Inventario_Automoviles"("Consecutivo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historial_Empleados" ADD CONSTRAINT "Historial_Empleados_Email_Empleado_fkey" FOREIGN KEY ("Email_Empleado") REFERENCES "Empleados"("Email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_Consecutivo_fkey" FOREIGN KEY ("Consecutivo") REFERENCES "Inventario_Automoviles"("Consecutivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_Email_Empleado_fkey" FOREIGN KEY ("Email_Empleado") REFERENCES "Empleados"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procesos" ADD CONSTRAINT "Procesos_Pk_folio_ticket_fkey" FOREIGN KEY ("Pk_folio_ticket") REFERENCES "Solicitud"("Pk_folio_ticket") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procesos" ADD CONSTRAINT "Procesos_Email_Empleado_fkey" FOREIGN KEY ("Email_Empleado") REFERENCES "Empleados"("Email") ON DELETE RESTRICT ON UPDATE CASCADE;
