# Event‑Driven Architecture

## Philosophy
The financial module reacts to **domain events** rather than being tightly coupled to the booking or procurement modules. This ensures:

- Loose coupling
- Ability to replay events
- Audit trail naturally emerges

## Event Types
All events are emitted by the respective domain modules (booking, procurement) and consumed by the financial service.

| Event Name | Source | Payload | Consumer Action |
|------------|--------|---------|-----------------|
| `booking.paid` | Booking service | `{ bookingId, amount, paymentDate, clientId }` | Create a journal entry (Revenue receivable / Cash) |
| `procurement.order.received` | Procurement | `{ orderId, supplierId, items[], total }` | Create a journal entry (Inventory / Accounts Payable) |
| `fiscal_period.opened` | Admin | `{ periodId }` | Activate period |
| `fiscal_period.closed` | Period closing | `{ periodId, closingDate }` | Prevent further posting, generate closing entries |

## Implementation
We use a lightweight in‑process event bus (e.g., a custom `EventEmitter` or `mitt`) because our monolith currently handles everything. When we move to a microservices future, the event bus can be replaced with a message queue.

**File**: `lib/financial/eventBus.ts`
**Listeners**: Registered in `financialApi.ts` on server startup.

Each event carries a `tenantId` and `userId` for multi‑tenant isolation and audit trail.

## Benefits
- Booking module knows nothing about accounting.
- New operational modules (e.g., inventory, HR) can emit events and automatically flow into the financial system without touching the financial code.