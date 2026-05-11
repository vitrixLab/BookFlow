-- CreateIndex
CREATE INDEX "BookedAppointment_datetime_idx" ON "BookedAppointment"("datetime");

-- CreateIndex
CREATE INDEX "BookedAppointment_status_idx" ON "BookedAppointment"("status");

-- CreateIndex
CREATE INDEX "BookedAppointment_clientId_idx" ON "BookedAppointment"("clientId");

-- CreateIndex
CREATE INDEX "BookedAppointment_employeeId_idx" ON "BookedAppointment"("employeeId");

-- CreateIndex
CREATE INDEX "BookedAppointment_createdAt_idx" ON "BookedAppointment"("createdAt");

-- CreateIndex
CREATE INDEX "Service_createdAt_idx" ON "Service"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
