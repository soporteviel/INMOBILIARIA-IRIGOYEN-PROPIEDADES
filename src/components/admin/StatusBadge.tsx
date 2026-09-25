import { STATUS_LABELS, type PropertyStatus } from "@/lib/properties/model";

const STATUS_CLASS: Record<PropertyStatus, string> = {
  PUBLICADA: "bg-[#e7eee9] text-[#155547]",
  BORRADOR: "bg-[#f3f1ec] text-[#5c5854]",
  PAUSADA: "bg-[#f8efd8] text-[#7a5410]",
};

export function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm ${STATUS_CLASS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
