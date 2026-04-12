import { AdminLayout } from './AdminLayout';
import { PaymentApprovalManager } from '@/components/admin/PaymentApprovalManager';

export default function AdminPaymentApprovals() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve bKash / Nagad payments submitted by customers
          </p>
        </div>
        <PaymentApprovalManager />
      </div>
    </AdminLayout>
  );
}
