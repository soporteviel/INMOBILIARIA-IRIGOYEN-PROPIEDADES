"use client";

import {
  deletePropertyAction,
  pausePropertyAction,
  publishPropertyAction,
  setFeaturedAction,
} from "@/app/admin/propiedades/actions";
import { IconMore, IconPause, IconPlus, IconPublish, IconTrash } from "@/components/admin/icons";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatPropertyPrice,
  PROPERTY_OPERATIONS,
  PROPERTY_TYPES,
  type PropertyOperation,
  type PropertyRecord,
  type PropertyStatus,
  type PropertyType,
} from "@/lib/properties/model";
import { App, Button, Dropdown, Input, Modal, Segmented, Select, Switch, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const SAVE_NOTICES = {
  creada: {
    title: "Propiedad creada",
    description: "El borrador quedó guardado.",
  },
  guardada: {
    title: "Cambios guardados",
    description: "La ficha se actualizó.",
  },
  publicada: {
    title: "Propiedad publicada",
    description: "Ya figura como publicada en el listado.",
  },
  reactivada: {
    title: "Propiedad reactivada",
    description: "Volvió a estar publicada.",
  },
  pausada: {
    title: "Propiedad pausada",
    description: "Dejó de estar publicada.",
  },
} as const;

function saveNoticeCopy(value: string | null) {
  if (!value || !(value in SAVE_NOTICES)) {
    return null;
  }
  return SAVE_NOTICES[value as keyof typeof SAVE_NOTICES];
}

function NewPropertyButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/admin/propiedades/nueva"
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#155547] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0c332e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547] ${className}`}
      style={{ backgroundColor: "#155547", color: "#ffffff" }}
    >
      <IconPlus />
      Nueva propiedad
    </Link>
  );
}

const STATUS_TABS: { label: string; value: PropertyStatus | "" }[] = [
  { label: "Todas", value: "" },
  { label: "Publicadas", value: "PUBLICADA" },
  { label: "Borradores", value: "BORRADOR" },
  { label: "Pausadas", value: "PAUSADA" },
];

export function PropertyTable({
  properties,
  query,
  status,
  propertyType,
  operation,
  removed,
  notice: noticeValue,
  unavailableMessage,
}: {
  properties: PropertyRecord[];
  query: string;
  status: PropertyStatus | "";
  propertyType: PropertyType | "";
  operation: PropertyOperation | "";
  removed: boolean;
  notice: string | null;
  unavailableMessage: string | null;
}) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query);
  const [filter, setFilter] = useState<PropertyStatus | "">(status);
  const [typeFilter, setTypeFilter] = useState<PropertyType | "">(propertyType);
  const [operationFilter, setOperationFilter] = useState<PropertyOperation | "">(operation);
  const [source, setSource] = useState({ query, status, propertyType, operation });
  const notice = saveNoticeCopy(noticeValue);

  if (
    source.query !== query ||
    source.status !== status ||
    source.propertyType !== propertyType ||
    source.operation !== operation
  ) {
    setSource({ query, status, propertyType, operation });
    setSearch(query);
    setFilter(status);
    setTypeFilter(propertyType);
    setOperationFilter(operation);
  }

  function apply(
    nextQuery = search,
    nextStatus = filter,
    nextType = typeFilter,
    nextOperation = operationFilter,
  ) {
    const params = new URLSearchParams();
    const cleanQuery = nextQuery.trim();
    if (cleanQuery) {
      params.set("q", cleanQuery);
    }
    if (nextStatus) {
      params.set("estado", nextStatus);
    }
    if (nextType) {
      params.set("tipo", nextType);
    }
    if (nextOperation) {
      params.set("operacion", nextOperation);
    }
    const href = params.size ? `/admin?${params}` : "/admin";
    router.push(href);
  }

  function selectStatus(next: PropertyStatus | "") {
    setFilter(next);
    apply(search, next);
  }

  function clearFilters() {
    setSearch("");
    setFilter("");
    setTypeFilter("");
    setOperationFilter("");
    router.push("/admin");
  }

  function closeNotice() {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (status) {
      params.set("estado", status);
    }
    if (propertyType) {
      params.set("tipo", propertyType);
    }
    if (operation) {
      params.set("operacion", operation);
    }
    const href = params.size ? `/admin?${params}` : "/admin";
    router.replace(href);
  }

  function run(task: () => Promise<{ ok: true } | { ok: false; message: string }>, success: string) {
    startTransition(async () => {
      const result = await task();
      if (!result.ok) {
        message.error(result.message);
        return;
      }
      message.success(success);
      router.refresh();
    });
  }

  function confirmDelete(row: PropertyRecord) {
    modal.confirm({
      title: `Eliminar “${row.title}”`,
      content: "La propiedad se borra de forma definitiva y no se puede recuperar.",
      okText: "Eliminar propiedad",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      autoFocusButton: "cancel",
      width: 440,
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            const result = await deletePropertyAction(row.id);
            if (!result.ok) {
              message.error(result.message);
              reject(new Error("delete-failed"));
              return;
            }
            router.push("/admin?eliminada=1");
            router.refresh();
            resolve();
          });
        }),
    });
  }

  const hasFilters = Boolean(query || status || propertyType || operation);
  const capped = properties.length >= 200;
  const countText = capped
    ? "Se muestran 200 propiedades"
    : properties.length === 0
      ? "Ninguna propiedad"
      : properties.length === 1
        ? "1 propiedad"
        : `${properties.length} propiedades`;

  return (
    <section>
      <Modal
        open={notice !== null}
        centered
        width={420}
        title={
          notice ? (
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7f2ee] text-[#155547]">
                <IconPublish />
              </span>
              {notice.title}
            </span>
          ) : null
        }
        footer={
          <Button type="primary" onClick={closeNotice}>
            Listo
          </Button>
        }
        closable={false}
        maskClosable={false}
        onCancel={closeNotice}
      >
        <p className="text-[15px] leading-relaxed text-[#5c5854]">{notice?.description}</p>
      </Modal>
      <h1 className="mb-4 text-xl font-medium tracking-normal text-[#2a2a2a]">Propiedades</h1>

      {removed ? (
        <p className="mb-4 rounded-lg border border-[#d5e4dc] bg-[#f3f8f5] px-4 py-3 text-[15px] text-[#155547]" role="status">
          Propiedad eliminada.
        </p>
      ) : null}

      {unavailableMessage ? (
        <div className="rounded-lg border border-[#e4e0d8] bg-white px-5 py-8" role="alert">
          <p className="text-[15px] text-[#2a2a2a]">{unavailableMessage}</p>
          <Button className="mt-4" onClick={() => router.refresh()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input.Search
              allowClear
              placeholder="Buscar por título o ubicación"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                if (!value && query) {
                  apply("", filter);
                }
              }}
              onSearch={(value) => apply(value, filter)}
              className="min-w-0 sm:max-w-xs"
              aria-label="Buscar propiedades"
            />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select
                allowClear
                placeholder="Tipo"
                aria-label="Tipo de propiedad"
                value={typeFilter || undefined}
                className="w-full sm:w-40"
                options={PROPERTY_TYPES.map((item) => ({ value: item, label: item }))}
                onChange={(value) => {
                  const next = (value ?? "") as PropertyType | "";
                  setTypeFilter(next);
                  apply(search, filter, next, operationFilter);
                }}
              />
              <Select
                allowClear
                placeholder="Operación"
                aria-label="Operación"
                value={operationFilter || undefined}
                className="w-full sm:w-40"
                options={PROPERTY_OPERATIONS.map((item) => ({ value: item, label: item }))}
                onChange={(value) => {
                  const next = (value ?? "") as PropertyOperation | "";
                  setOperationFilter(next);
                  apply(search, filter, typeFilter, next);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <div className="col-span-2 grid grid-cols-2 gap-2" role="group" aria-label="Estado">
                {STATUS_TABS.map((tab) => {
                  const selected = filter === tab.value;
                  return (
                    <button
                      key={tab.label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectStatus(tab.value)}
                      className={`h-9 rounded-lg border text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547] ${
                        selected
                          ? "border-[#155547] bg-white font-medium text-[#155547]"
                          : "border-[#e4e0d8] bg-white text-[#2a2a2a]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <NewPropertyButton className="col-span-2 w-full" />
            </div>
            <div className="hidden sm:block">
              <Segmented
                aria-label="Estado"
                value={filter}
                onChange={(value) => selectStatus(value as PropertyStatus | "")}
                options={STATUS_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
              />
            </div>
            <div className="hidden sm:ml-10 sm:block">
              <NewPropertyButton />
            </div>
            <p className="text-sm text-[#5c5854] sm:ml-auto">{countText}</p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-lg border border-[#e4e0d8] bg-white">
            {properties.length === 0 ? (
              <div className="px-5 py-12 text-center">
                {hasFilters ? (
                  <>
                    <p className="text-[15px] text-[#2a2a2a]">Ninguna propiedad coincide con la búsqueda o los filtros.</p>
                    <Button className="mt-4" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-base text-[#2a2a2a]">Todavía no cargaste propiedades</p>
                    <div className="mt-4 flex justify-center">
                      <NewPropertyButton />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Table
                rowKey="id"
                size="small"
                columns={columns({ pending, run, confirmDelete })}
                dataSource={properties}
                pagination={false}
                scroll={{ x: 980 }}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}

function columns({
  pending,
  run,
  confirmDelete,
}: {
  pending: boolean;
  run: (task: () => Promise<{ ok: true } | { ok: false; message: string }>, success: string) => void;
  confirmDelete: (row: PropertyRecord) => void;
}): ColumnsType<PropertyRecord> {
  return [
    {
      title: "Propiedad",
      dataIndex: "title",
      width: "36%",
      onCell: () => ({ style: { overflow: "hidden" } }),
      render: (_title: string, row) => <PropertySummary row={row} />,
    },
    {
      title: "Tipo / operación",
      key: "kind",
      width: 180,
      render: (_, row) => <span className="text-[15px] text-[#5c5854]">{typeAndOperation(row)}</span>,
    },
    {
      title: "Precio",
      key: "price",
      width: 180,
      render: (_, row) => <span className="text-[15px]">{formatPropertyPrice(row)}</span>,
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 130,
      render: (value: PropertyStatus) => <StatusBadge status={value} />,
    },
    {
      title: "Destacada",
      key: "featured",
      width: 140,
      render: (_, row) => (
        <FeaturedControl
          row={row}
          pending={pending}
          onToggle={(checked) =>
            run(
              () => setFeaturedAction(row.id, checked),
              checked ? "Propiedad destacada." : "Dejó de estar destacada.",
            )
          }
        />
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 170,
      render: (_, row) => <RowActions row={row} pending={pending} onRun={run} onDelete={confirmDelete} />,
    },
  ];
}

function PropertySummary({ row }: { row: PropertyRecord }) {
  return (
    <div className="min-w-0">
      <Tooltip title={row.title}>
        <Link
          href={`/admin/propiedades/${row.id}`}
          title={row.title}
          className="block truncate text-[15px] font-medium text-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
        >
          {row.title}
        </Link>
      </Tooltip>
      <p className="mt-0.5 truncate text-sm text-[#5c5854]">{row.location || "Sin ubicación"}</p>
    </div>
  );
}

function typeAndOperation(row: PropertyRecord) {
  return `${row.propertyType ?? "Sin tipo"} · ${row.operation ?? "Sin operación"}`;
}

function FeaturedControl({
  row,
  pending,
  onToggle,
}: {
  row: PropertyRecord;
  pending: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const name = row.featured ? `Quitar destacada: ${row.title}` : `Destacar: ${row.title}`;
  return (
    <span className="inline-flex items-center gap-2">
      <Switch
        checked={row.featured}
        disabled={pending}
        aria-label={name}
        onChange={onToggle}
      />
      <span className="text-sm text-[#5c5854]">{row.featured ? "Sí" : "No"}</span>
    </span>
  );
}

function RowActions({
  row,
  pending,
  onRun,
  onDelete,
}: {
  row: PropertyRecord;
  pending: boolean;
  onRun: (task: () => Promise<{ ok: true } | { ok: false; message: string }>, success: string) => void;
  onDelete: (row: PropertyRecord) => void;
}) {
  const publishLabel = row.status === "PAUSADA" ? "Reactivar" : "Publicar";
  const items =
    row.status === "PUBLICADA"
      ? [
          {
            key: "pause",
            icon: <IconPause />,
            label: "Pausar",
            disabled: pending,
            onClick: () => onRun(() => pausePropertyAction(row.id), "Propiedad pausada."),
          },
        ]
      : [
          {
            key: "publish",
            icon: <IconPublish />,
            label: publishLabel,
            disabled: pending,
            onClick: () => onRun(() => publishPropertyAction(row.id), "Propiedad publicada."),
          },
        ];

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/propiedades/${row.id}`}
        className="inline-flex h-8 items-center rounded-md px-2 text-sm font-medium text-[#155547] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
      >
        Editar
      </Link>
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            ...items,
            {
              key: "delete",
              icon: <IconTrash />,
              label: "Eliminar",
              danger: true,
              disabled: pending,
              onClick: () => onDelete(row),
            },
          ],
        }}
      >
        <Button
          type="text"
          aria-label={`Más acciones de ${row.title}`}
          icon={<IconMore />}
          disabled={pending}
          className="!h-8 !w-8"
        />
      </Dropdown>
    </div>
  );
}
