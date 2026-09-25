"use client";

import {
  deletePropertyAction,
  pausePropertyAction,
  publishPropertyAction,
  setFeaturedAction,
} from "@/app/admin/propiedades/actions";
import { IconMore, IconPause, IconPublish, IconTrash } from "@/components/admin/icons";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatPropertyPrice,
  type PropertyRecord,
  type PropertyStatus,
} from "@/lib/properties/model";
import { App, Button, Dropdown, Input, Segmented, Switch, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  removed,
  unavailableMessage,
}: {
  properties: PropertyRecord[];
  query: string;
  status: PropertyStatus | "";
  removed: boolean;
  unavailableMessage: string | null;
}) {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query);
  const [filter, setFilter] = useState<PropertyStatus | "">(status);
  const [source, setSource] = useState({ query, status });

  if (source.query !== query || source.status !== status) {
    setSource({ query, status });
    setSearch(query);
    setFilter(status);
  }

  function apply(nextQuery = search, nextStatus = filter) {
    const params = new URLSearchParams();
    const cleanQuery = nextQuery.trim();
    if (cleanQuery) {
      params.set("q", cleanQuery);
    }
    if (nextStatus) {
      params.set("estado", nextStatus);
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
    router.push("/admin");
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

  const hasFilters = Boolean(query || status);
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
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-normal text-[#2a2a2a]">Propiedades</h1>
          {unavailableMessage ? null : (
            <p className="mt-1 text-[15px] text-[#5c5854]">{countText}</p>
          )}
        </div>
        <Link
          href="/admin/propiedades/nueva"
          className="inline-flex h-[42px] items-center justify-center rounded-lg bg-[#155547] px-4 text-[15px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
        >
          Nueva propiedad
        </Link>
      </div>

      {removed ? (
        <p className="mb-4 rounded-lg border border-[#d5e4dc] bg-[#f3f8f5] px-4 py-3 text-[15px] text-[#155547]" role="status">
          Propiedad eliminada.
        </p>
      ) : null}

      {unavailableMessage ? (
        <div className="rounded-[10px] border border-[#e4e0d8] bg-white px-5 py-8" role="alert">
          <p className="text-[15px] text-[#2a2a2a]">{unavailableMessage}</p>
          <Button className="mt-4" onClick={() => router.refresh()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-[#e4e0d8] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#efece6] p-4 lg:flex-row lg:items-center">
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
              className="min-w-0 lg:max-w-sm"
              aria-label="Buscar propiedades"
            />
            <div className="grid grid-cols-2 gap-2 sm:hidden" role="group" aria-label="Estado">
              {STATUS_TABS.map((tab) => {
                const selected = filter === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectStatus(tab.value)}
                    className={`h-[42px] rounded-lg border text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547] ${
                      selected
                        ? "border-[#155547] bg-white font-medium text-[#155547]"
                        : "border-[#e4e0d8] bg-[#fbfaf7] text-[#2a2a2a]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <Segmented
              className="hidden sm:inline-flex"
              aria-label="Estado"
              value={filter}
              onChange={(value) => selectStatus(value as PropertyStatus | "")}
              options={STATUS_TABS.map((tab) => ({ label: tab.label, value: tab.value }))}
            />
          </div>

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
                  <Link
                    href="/admin/propiedades/nueva"
                    className="mt-4 inline-flex h-[42px] items-center justify-center rounded-lg bg-[#155547] px-4 text-[15px] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
                  >
                    Nueva propiedad
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <ul className="md:hidden">
                {properties.map((row) => (
                  <li key={row.id} className="border-b border-[#efece6] px-4 py-4 last:border-b-0">
                    <PropertySummary row={row} />
                    <div className="mt-3 flex items-center justify-between gap-3">
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
                      <RowActions row={row} pending={pending} onRun={run} onDelete={confirmDelete} />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden min-w-0 md:block">
                <Table
                  rowKey="id"
                  columns={columns({ pending, run, confirmDelete })}
                  dataSource={properties}
                  pagination={false}
                  tableLayout="fixed"
                />
              </div>
            </>
          )}
        </div>
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
      <p className="mt-1 text-sm text-[#5c5854] md:hidden">
        {typeAndOperation(row)} · {formatPropertyPrice(row)}
      </p>
      <div className="mt-2 md:hidden">
        <StatusBadge status={row.status} />
      </div>
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
        className="inline-flex h-11 items-center rounded-lg px-2 text-[15px] font-medium text-[#155547] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155547]"
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
          className="!h-11 !w-11"
        />
      </Dropdown>
    </div>
  );
}
