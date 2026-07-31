import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSystemSettingsAction, getAuditLogsAction } from "@/app/actions/systemActions";
import SystemSettingsClient, {
  SystemSettingsData,
  AuditLogData,
} from "@/components/SystemSettingsClient";

export const revalidate = 0;

export default async function PengaturanPage() {
  const session = await getSession();

  if (!session || session.role !== "super_admin") {
    redirect("/?unauthorized=true");
  }

  const [settingsRes, auditLogsRes] = await Promise.all([
    getSystemSettingsAction(),
    getAuditLogsAction(),
  ]);

  const initialSettings = settingsRes.success && settingsRes.data
    ? settingsRes.data
    : {
        id: 1,
        namaToko: "Kasir Coffee Shop",
        alamatToko: "Jl. Kopi Harapan No. 88, Jakarta",
        teleponToko: "0812-3456-7890",
        persenPajak: 10,
      };

  const initialAuditLogs = auditLogsRes.success && auditLogsRes.data
    ? auditLogsRes.data
    : [];

  return (
    <SystemSettingsClient
      initialSettings={JSON.parse(JSON.stringify(initialSettings)) as SystemSettingsData}
      initialAuditLogs={JSON.parse(JSON.stringify(initialAuditLogs)) as AuditLogData[]}
    />
  );
}
